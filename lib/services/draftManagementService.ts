import mongoose from 'mongoose';
import Article from '@/lib/models/Article';
import NotificationModel from '@/lib/models/Notification';

/**
 * Draft Management Service
 * Handles draft inactivity tracking, notifications, and automatic deletion
 */

export interface DraftInactivityConfig {
  // Days of inactivity before first warning
  firstWarningDays: number;
  // Days of inactivity before second warning
  secondWarningDays: number;
  // Days of inactivity before final warning
  finalWarningDays: number;
  // Days of inactivity before deletion
  deletionDays: number;
  // Grace period after marking for deletion (days)
  gracePeriodDays: number;
}

// Default configuration
export const DEFAULT_INACTIVITY_CONFIG: DraftInactivityConfig = {
  firstWarningDays: 30,    // 30 days
  secondWarningDays: 45,   // 45 days
  finalWarningDays: 60,    // 60 days
  deletionDays: 75,        // 75 days
  gracePeriodDays: 7       // 7 days grace period
};

/**
 * Update draft activity timestamp
 */
export async function updateDraftActivity(
  draftId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input parameters
    if (!draftId) {
      throw new Error('Draft ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Ensure valid ObjectId format
    let validDraftId: mongoose.Types.ObjectId;
    let validUserId: mongoose.Types.ObjectId;
    
    try {
      validDraftId = typeof draftId === 'string' ? new mongoose.Types.ObjectId(draftId) : draftId;
      validUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    } catch (idError) {
      throw new Error('Invalid ID format provided');
    }

    const result = await Article.findOneAndUpdate(
      { 
        _id: validDraftId, 
        userId: validUserId,
        status: 'draft'
      },
      {
        $set: {
          'draftMetadata.lastActivity': new Date(),
          'draftMetadata.isMarkedForDeletion': false,
          'draftMetadata.scheduledDeletionDate': null
        }
      },
      { new: true }
    );

    if (!result) {
      throw new Error('Draft not found or user does not have permission to update it');
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error updating draft activity:', errorMessage, { draftId, userId });
    return { success: false, error: errorMessage };
  }
}

/**
 * Find drafts that need inactivity warnings
 */
export async function findDraftsNeedingWarnings(
  config: DraftInactivityConfig = DEFAULT_INACTIVITY_CONFIG
): Promise<{
  success: boolean;
  results: Array<{
    draft: any;
    warningType: 'first' | 'second' | 'final';
    daysInactive: number;
  }>;
  error?: string;
}> {
  try {
    // Validate config
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration provided');
    }

    const requiredFields: (keyof DraftInactivityConfig)[] = ['firstWarningDays', 'secondWarningDays', 'finalWarningDays', 'deletionDays'];
    for (const field of requiredFields) {
      if (typeof config[field] !== 'number' || config[field] < 0) {
        throw new Error(`Invalid ${field} in configuration`);
      }
    }

    const now = new Date();
    const results: Array<{ draft: any; warningType: 'first' | 'second' | 'final'; daysInactive: number }> = [];

    // Calculate cutoff dates
    const firstWarningDate = new Date(now.getTime() - config.firstWarningDays * 24 * 60 * 60 * 1000);
    const secondWarningDate = new Date(now.getTime() - config.secondWarningDays * 24 * 60 * 60 * 1000);
    const finalWarningDate = new Date(now.getTime() - config.finalWarningDays * 24 * 60 * 60 * 1000);

    // Optimized: Use single aggregation query to find all drafts needing warnings
    const allDrafts = await Article.find({
      status: 'draft',
      'draftMetadata.lastActivity': { $lt: firstWarningDate }, // Get all drafts older than first warning
      'draftMetadata.inactivityWarningsSent': { $lt: 3 }, // Exclude those already sent final warning
      'draftMetadata.isMarkedForDeletion': { $ne: true }
    })
    .populate('userId', 'name email')
    .lean();

    // Categorize drafts based on their warning status and activity date
    const firstWarningDrafts = allDrafts.filter(draft => 
      draft.draftMetadata.lastActivity < firstWarningDate && 
      draft.draftMetadata.inactivityWarningsSent < 1
    );
    
    const secondWarningDrafts = allDrafts.filter(draft => 
      draft.draftMetadata.lastActivity < secondWarningDate && 
      draft.draftMetadata.inactivityWarningsSent < 2 &&
      draft.draftMetadata.inactivityWarningsSent >= 1
    );
    
    const finalWarningDrafts = allDrafts.filter(draft => 
      draft.draftMetadata.lastActivity < finalWarningDate && 
      draft.draftMetadata.inactivityWarningsSent < 3 &&
      draft.draftMetadata.inactivityWarningsSent >= 2
    );

    // Process results with validation
    const processDrafts = (drafts: any[], warningType: 'first' | 'second' | 'final', minWarnings: number = 0) => {
      drafts.forEach(draft => {
        try {
          // Validate draft structure
          if (!draft || !draft.draftMetadata || !draft.draftMetadata.lastActivity) {
            console.warn(`Skipping draft ${draft?._id}: missing required metadata`);
            return;
          }

          const lastActivity = new Date(draft.draftMetadata.lastActivity);
          if (isNaN(lastActivity.getTime())) {
            console.warn(`Skipping draft ${draft._id}: invalid lastActivity date`);
            return;
          }

          const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
          const warningsSent = draft.draftMetadata.inactivityWarningsSent || 0;

          if (warningsSent >= minWarnings) {
            results.push({ draft, warningType, daysInactive });
          }
        } catch (processingError) {
          console.error(`Error processing draft ${draft?._id}:`, processingError);
        }
      });
    };

    processDrafts(firstWarningDrafts, 'first', 0);
    processDrafts(secondWarningDrafts, 'second', 1);
    processDrafts(finalWarningDrafts, 'final', 2);

    return { success: true, results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error finding drafts needing warnings:', errorMessage);
    return { success: false, results: [], error: errorMessage };
  }
}

/**
 * Send inactivity warning notification
 */
export async function sendInactivityWarning(
  draft: any,
  warningType: 'first' | 'second' | 'final',
  daysInactive: number,
  config: DraftInactivityConfig = DEFAULT_INACTIVITY_CONFIG
): Promise<boolean> {
  try {
    let title: string;
    let message: string;
    let daysUntilDeletion: number;

    switch (warningType) {
      case 'first':
        daysUntilDeletion = config.deletionDays - daysInactive;
        title = 'Draft Inactivity Warning';
        message = `Your draft "${draft.title}" hasn't been edited for ${daysInactive} days. It will be automatically deleted in ${daysUntilDeletion} days if not updated.`;
        break;
      case 'second':
        daysUntilDeletion = config.deletionDays - daysInactive;
        title = 'Draft Deletion Warning';
        message = `Your draft "${draft.title}" hasn't been edited for ${daysInactive} days. It will be automatically deleted in ${daysUntilDeletion} days if not updated. Please edit or save your draft to prevent deletion.`;
        break;
      case 'final':
        daysUntilDeletion = config.deletionDays - daysInactive;
        title = 'Final Draft Deletion Warning';
        message = `FINAL WARNING: Your draft "${draft.title}" hasn't been edited for ${daysInactive} days. It will be automatically deleted in ${daysUntilDeletion} days if not updated. This is your last warning before deletion.`;
        break;
    }

    // Create notification
    await NotificationModel.create({
      userId: draft.userId._id || draft.userId,
      type: 'draft_inactivity_warning',
      title,
      message,
      metadata: {
        draftId: draft._id,
        draftTitle: draft.title,
        warningType,
        daysInactive,
        daysUntilDeletion,
        scheduledDeletionDate: new Date(Date.now() + daysUntilDeletion * 24 * 60 * 60 * 1000)
      },
      priority: warningType === 'final' ? 'high' : 'medium'
    });

    // Update draft warning count
    await Article.findByIdAndUpdate(draft._id, {
      $inc: { 'draftMetadata.inactivityWarningsSent': 1 }
    });



    return true;
  } catch (error) {
    console.error('Error sending inactivity warning:', error);
    return false;
  }
}

/**
 * Find drafts ready for deletion
 */
export async function findDraftsForDeletion(
  config: DraftInactivityConfig = DEFAULT_INACTIVITY_CONFIG
): Promise<any[]> {
  const deletionDate = new Date(Date.now() - config.deletionDays * 24 * 60 * 60 * 1000);

  try {
    return await Article.find({
      status: 'draft',
      'draftMetadata.lastActivity': { $lt: deletionDate },
      'draftMetadata.isMarkedForDeletion': { $ne: true }
    }).populate('userId', 'name email');
  } catch (error) {
    console.error('Error finding drafts for deletion:', error);
    return [];
  }
}

/**
 * Mark draft for deletion (with grace period)
 */
export async function markDraftForDeletion(
  draftId: string | mongoose.Types.ObjectId,
  config: DraftInactivityConfig = DEFAULT_INACTIVITY_CONFIG
): Promise<boolean> {
  try {
    const gracePeriodEnd = new Date(Date.now() + config.gracePeriodDays * 24 * 60 * 60 * 1000);

    const draft = await Article.findByIdAndUpdate(
      draftId,
      {
        $set: {
          'draftMetadata.isMarkedForDeletion': true,
          'draftMetadata.scheduledDeletionDate': gracePeriodEnd,
          'draftMetadata.deletionGracePeriod': gracePeriodEnd
        }
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!draft) return false;

    // Send final deletion notice
    await NotificationModel.create({
      userId: draft.userId._id || draft.userId,
      type: 'draft_marked_for_deletion',
      title: 'Draft Scheduled for Deletion',
      message: `Your draft "${draft.title}" has been scheduled for deletion due to inactivity. It will be permanently deleted on ${gracePeriodEnd.toLocaleDateString()}. Edit the draft to cancel deletion.`,
      metadata: {
        draftId: draft._id,
        draftTitle: draft.title,
        scheduledDeletionDate: gracePeriodEnd,
        gracePeriodDays: config.gracePeriodDays
      },
      priority: 'high'
    });

    return true;
  } catch (error) {
    console.error('Error marking draft for deletion:', error);
    return false;
  }
}

/**
 * Delete drafts that have exceeded grace period
 */
export async function deleteDraftsAfterGracePeriod(): Promise<{
  deletedCount: number;
  deletedDrafts: Array<{ id: string; title: string; userId: string }>;
  errors: string[];
}> {
  const now = new Date();
  const result = {
    deletedCount: 0,
    deletedDrafts: [] as Array<{ id: string; title: string; userId: string }>,
    errors: [] as string[]
  };

  try {
    // Find drafts marked for deletion with expired grace period
    const draftsToDelete = await Article.find({
      status: 'draft',
      'draftMetadata.isMarkedForDeletion': true,
      'draftMetadata.scheduledDeletionDate': { $lt: now }
    }).populate('userId', 'name email');

    for (const draft of draftsToDelete) {
      try {
        // Create backup record in DeletedDraft collection
        // TODO: Implement DeletedDraft model
        // await DeletedDraft.createFromDraft(draft, 'inactivity');



        // Send deletion notification
        await NotificationModel.create({
          userId: draft.userId._id || draft.userId,
          type: 'draft_deleted',
          title: 'Draft Deleted',
          message: `Your draft "${draft.title}" has been automatically deleted due to inactivity. You can recover it from your deleted drafts within 30 days.`,
          metadata: {
            draftId: draft._id,
            draftTitle: draft.title,
            deletionDate: now,
            deletionReason: 'inactivity',
            canRecover: true,
            recoveryPeriodDays: 30
          },
          priority: 'medium'
        });

        // Delete the draft
        await Article.findByIdAndDelete(draft._id);

        result.deletedDrafts.push({
          id: draft._id.toString(),
          title: draft.title,
          userId: (draft.userId._id || draft.userId).toString()
        });
        result.deletedCount++;

      } catch (error) {
        const errorMsg = `Failed to delete draft ${draft._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

  } catch (error) {
    const errorMsg = `Error in deleteDraftsAfterGracePeriod: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
  }

  return result;
}

/**
 * Recover a draft from deletion
 */
export async function recoverDraftFromDeletion(
  draftId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  try {
    const draft = await Article.findOneAndUpdate(
      {
        _id: draftId,
        userId: userId,
        status: 'draft',
        'draftMetadata.isMarkedForDeletion': true
      },
      {
        $set: {
          'draftMetadata.isMarkedForDeletion': false,
          'draftMetadata.scheduledDeletionDate': null,
          'draftMetadata.deletionGracePeriod': null,
          'draftMetadata.lastActivity': new Date()
        }
      },
      { new: true }
    );

    if (!draft) return false;



    // Send recovery notification
    await NotificationModel.create({
      userId: userId,
      type: 'draft_recovered',
      title: 'Draft Recovered',
      message: `Your draft "${draft.title}" has been recovered from scheduled deletion.`,
      metadata: {
        draftId: draft._id,
        draftTitle: draft.title,
        recoveryDate: new Date()
      },
      priority: 'low'
    });

    return true;
  } catch (error) {
    console.error('Error recovering draft from deletion:', error);
    return false;
  }
}

/**
 * Get draft deletion status
 */
export function getDraftDeletionStatus(draft: any, config: DraftInactivityConfig = DEFAULT_INACTIVITY_CONFIG): {
  status: 'active' | 'warning' | 'final_warning' | 'marked_for_deletion';
  daysInactive: number;
  daysUntilDeletion: number;
  scheduledDeletionDate?: Date;
  canRecover: boolean;
} {
  const now = new Date();
  const lastActivity = draft.draftMetadata?.lastActivity || draft.updatedAt;
  const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

  if (draft.draftMetadata?.isMarkedForDeletion) {
    return {
      status: 'marked_for_deletion',
      daysInactive,
      daysUntilDeletion: 0,
      scheduledDeletionDate: draft.draftMetadata.scheduledDeletionDate,
      canRecover: true
    };
  }

  const daysUntilDeletion = config.deletionDays - daysInactive;

  if (daysInactive >= config.finalWarningDays) {
    return {
      status: 'final_warning',
      daysInactive,
      daysUntilDeletion,
      canRecover: true
    };
  }

  if (daysInactive >= config.secondWarningDays) {
    return {
      status: 'warning',
      daysInactive,
      daysUntilDeletion,
      canRecover: true
    };
  }

  return {
    status: 'active',
    daysInactive,
    daysUntilDeletion,
    canRecover: true
  };
}

/**
 * Process all draft inactivity checks and actions
 */
export async function processDraftInactivity(
  config: DraftInactivityConfig = DEFAULT_INACTIVITY_CONFIG
): Promise<{
  warningsSent: number;
  draftsMarkedForDeletion: number;
  draftsDeleted: number;
  errors: string[];
}> {
  const result = {
    warningsSent: 0,
    draftsMarkedForDeletion: 0,
    draftsDeleted: 0,
    errors: [] as string[]
  };

  try {
    // 1. Send inactivity warnings
    const warningsResult = await findDraftsNeedingWarnings(config);
    if (!warningsResult.success) {
      result.errors.push(`Failed to find drafts needing warnings: ${warningsResult.error}`);
    } else {
      for (const { draft, warningType, daysInactive } of warningsResult.results) {
        const success = await sendInactivityWarning(draft, warningType, daysInactive, config);
        if (success) {
          result.warningsSent++;
        } else {
          result.errors.push(`Failed to send ${warningType} warning for draft ${draft._id}`);
        }
      }
    }

    // 2. Mark drafts for deletion
    const draftsForDeletion = await findDraftsForDeletion(config);
    for (const draft of draftsForDeletion) {
      const success = await markDraftForDeletion(draft._id, config);
      if (success) {
        result.draftsMarkedForDeletion++;
      } else {
        result.errors.push(`Failed to mark draft ${draft._id} for deletion`);
      }
    }

    // 3. Delete drafts after grace period
    const deletionResult = await deleteDraftsAfterGracePeriod();
    result.draftsDeleted = deletionResult.deletedCount;
    result.errors.push(...deletionResult.errors);

  } catch (error) {
    const errorMsg = `Error in processDraftInactivity: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
  }

  return result;
}

/**
 * Get recoverable deleted drafts for a user
 */
export async function getRecoverableDeletedDrafts(
  userId: string | mongoose.Types.ObjectId
): Promise<any[]> {
  try {
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    // TODO: Implement DeletedDraft model
    // return await DeletedDraft.findRecoverableByUser(userIdObj);
    return [];
  } catch (error) {
    console.error('Error getting recoverable deleted drafts:', error);
    return [];
  }
}



/**
 * Permanently delete expired deleted drafts
 */
export async function cleanupExpiredDeletedDrafts(): Promise<number> {
  try {
    // TODO: Implement DeletedDraft model
    // const result = await DeletedDraft.cleanupExpired();
    // return result.deletedCount || 0;
    return 0;
  } catch (error) {
    console.error('Error cleaning up expired deleted drafts:', error);
    return 0;
  }
}
