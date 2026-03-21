import { ReactNode, useEffect } from "react";
import {
  resolveSectionState,
  type SectionDataState,
  type SectionErrorState,
  type SectionStateKind,
} from "./resolveSectionState";
import {
  renderSectionByState,
  type SectionBodyRenderMap,
} from "./renderSectionByState";
import { useRefreshVisibility } from "./useRefreshVisibility";

interface SectionContainerProps {
  dataState: SectionDataState;
  errorState: SectionErrorState;
  isRefreshing: boolean;
  renderBody: SectionBodyRenderMap<ReactNode>;
  renderNonBlockingError?: () => ReactNode;
  renderRefreshingNotice?: () => ReactNode;
  refreshVisibilityOptions?: {
    showDelayMs?: number;
    minVisibleMs?: number;
  };
  debugId?: string;
  enableDebug?: boolean;
}

interface SectionDebugPayload {
  sectionState: SectionStateKind;
  dataState: SectionDataState;
  errorState: SectionErrorState;
  isRefreshing: boolean;
  debugId?: string;
}

function logSectionDebugState(payload: SectionDebugPayload) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const label = payload.debugId ? `[ui-state:${payload.debugId}]` : "[ui-state]";
  console.debug(label, {
    sectionState: payload.sectionState,
    dataState: payload.dataState,
    errorState: payload.errorState,
    isRefreshing: payload.isRefreshing,
  });
}

export default function SectionContainer({
  dataState,
  errorState,
  isRefreshing,
  renderBody,
  renderNonBlockingError,
  renderRefreshingNotice,
  refreshVisibilityOptions,
  debugId,
  enableDebug = false,
}: SectionContainerProps) {
  const sectionState = resolveSectionState({
    dataState,
    errorState,
    isRefreshing,
  });
  const showRefreshingNotice = useRefreshVisibility(
    sectionState === "loading-refresh",
    refreshVisibilityOptions
  );

  const isDebugEnabled = process.env.NODE_ENV !== "production" && enableDebug;

  useEffect(() => {
    if (!isDebugEnabled) {
      return;
    }

    logSectionDebugState({
      sectionState,
      dataState,
      errorState,
      isRefreshing,
      debugId,
    });
  }, [dataState, debugId, errorState, isDebugEnabled, isRefreshing, sectionState]);

  const content = (
    <>
      {sectionState === "error-nonblocking" && renderNonBlockingError?.()}
      {showRefreshingNotice && renderRefreshingNotice?.()}
      {renderSectionByState(sectionState, renderBody)}
    </>
  );

  if (!isDebugEnabled) {
    return content;
  }

  return (
    <div
      className="contents"
      data-ui-state-debug={debugId || "section"}
      data-ui-section-state={sectionState}
      data-ui-data-state={dataState}
      data-ui-error-state={errorState}
    >
      {content}
    </div>
  );
}

export type { SectionContainerProps };