"use client";

import { useEffect, useState } from "react";
import { Modal } from '@/components/ui/Modal'
import {
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  RotateCcw,
  Save,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { Loading } from '@/components/ui/Loading'
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import ImageUploadContainer from "@/components/containers/ImageUploadContainer";
import { PageStateGuard } from "@/components/shared";
import EmptyState from "@/components/shared/EmptyState";
import AdminActionModal from "@/components/admin/AdminActionModal";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import AdminListLayout from "@/components/admin/AdminListLayout";
import { Badge } from '@/components/ui/Badge'

type Material = {
  _id: string;
  title: string;
  description: string;
  category:
    | "toolkit"
    | "course"
    | "video"
    | "guide"
    | "document"
    | "emergency"
    | "other";
  type: string;
  url: string;
  imageUrl?: string;
  provider?: string;
  duration?: string;
  language: string[];
  tags: string[];
  featured: boolean;
  isPublished: boolean;
  order: number;
  views: number;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
};

export default function MaterialsAdminPage() {
  const { showError, showSuccess } = useGlobalFeedback();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState(false);
  const [materialStats, setMaterialStats] = useState({
    total: 0,
    published: 0,
    unpublished: 0,
    featured: 0,
  });
  const [materialPagination, setMaterialPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );
  const [showMaterialFormModal, setShowMaterialFormModal] = useState(false);
  const [deleteConfirmMaterial, setDeleteConfirmMaterial] = useState<Material | null>(
    null,
  );
  const [materialFormData, setMaterialFormData] = useState<Partial<Material>>({
    title: "",
    description: "",
    category: "other",
    type: "",
    url: "",
    imageUrl: "",
    provider: "",
    duration: "",
    language: ["en"],
    tags: [],
    featured: false,
    isPublished: true,
    order: 0,
  });
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState("all");
  const [materialSearch, setMaterialSearch] = useState("");

  const unwrapPayload = (responseData: any) =>
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;

  const loadMaterials = async () => {
    try {
      setTabLoading(true);
      const params = new URLSearchParams({
        page: materialPagination.page.toString(),
        limit: "20",
      });

      if (materialSearch.trim()) {
        params.append("search", materialSearch.trim());
      }

      if (materialCategoryFilter !== "all") {
        params.append("category", materialCategoryFilter);
      }

      const response = await fetch(`/api/admin/materials?${params}`);
      if (response.ok) {
        const responseData = await response.json();
        const data = unwrapPayload(responseData);
        setMaterials(data.materials || []);
        setMaterialPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
        });

        if (data.stats) {
          setMaterialStats({
            total: data.stats.total || 0,
            published: data.stats.published || 0,
            unpublished: data.stats.unpublished || 0,
            featured: data.stats.featured || 0,
          });
        } else {
          const published = (data.materials || []).filter(
            (m: Material) => m.isPublished,
          ).length;
          const featured = (data.materials || []).filter(
            (m: Material) => m.featured,
          ).length;
          setMaterialStats({
            total: data.total || 0,
            published,
            unpublished: Math.max((data.total || 0) - published, 0),
            featured,
          });
        }
      }
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMaterials().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateMaterial = () => {
    setMaterialFormData({
      title: "",
      description: "",
      category: "other",
      type: "",
      url: "",
      imageUrl: "",
      provider: "",
      duration: "",
      language: ["en"],
      tags: [],
      featured: false,
      isPublished: true,
      order: 0,
    });
    setSelectedMaterial(null);
    setShowMaterialFormModal(true);
  };

  const handleEditMaterial = (material: Material) => {
    setMaterialFormData(material);
    setSelectedMaterial(material);
    setShowMaterialFormModal(true);
  };

  const handleSaveMaterial = async () => {
    if (
      !materialFormData.title ||
      !materialFormData.description ||
      !materialFormData.category ||
      !materialFormData.type ||
      !materialFormData.url
    ) {
      showError(
        "Zəhmət olmasa tələb olunan xanaları doldurun: başlıq, təsvir, kateqoriya, növ və URL",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const url = selectedMaterial
        ? `/api/materials/${selectedMaterial._id}`
        : "/api/materials";
      const method = selectedMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialFormData),
      });

      if (response.ok) {
        setShowMaterialFormModal(false);
        setSelectedMaterial(null);
        await loadMaterials();
        showSuccess(
          selectedMaterial
            ? "Material uğurla yeniləndi"
            : "Material uğurla yaradıldı",
        );
      } else {
        const error = await response.json();
        showError(error.error || "Materialı yadda saxlamaq alınmadı");
      }
    } catch (error) {
      console.error("Error saving material:", error);
      showError("Materialı yadda saxlamaq alınmadı");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setDeletingMaterial(true);
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadMaterials();
        showSuccess("Material uğurla silindi");
        setDeleteConfirmMaterial(null);
      } else {
        showError("Materialı silmək alınmadı");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      showError("Materialı silmək alınmadı");
    } finally {
      setDeletingMaterial(false);
    }
  };

  const handleToggleMaterialPublish = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...material,
          isPublished: !material.isPublished,
        }),
      });

      if (response.ok) {
        await loadMaterials();
      } else {
        showError("Yayım statusunu dəyişmək alınmadı");
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      showError("Yayım statusunu dəyişmək alınmadı");
    }
  };

  const handleToggleMaterialFeatured = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...material, featured: !material.featured }),
      });

      if (response.ok) {
        await loadMaterials();
      } else {
        showError("Önə çıxarma statusunu dəyişmək alınmadı");
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
      showError("Önə çıxarma statusunu dəyişmək alınmadı");
    }
  };

  return (
    <PageStateGuard
      isLoading={loading}
      isError={false}
      isEmpty={false}
      loadingText="İdarəetmə paneli yüklənir..."
    >
    <AdminListLayout title="Materialların İdarə Edilməsi" description="Təhsil resurslarını təşkil edin və idarə edin.">
      <div className="py-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl shadow-md p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">
                    Materialların idarə edilməsi
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Təhsil resurslarını təşkil edin və idarə edin
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCreateMaterial}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-300 font-semibold px-6 py-3"
            >
              <FileText className="w-5 h-5 mr-2" />
              {"Yeni material əlavə et"}
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Cəmi</p>
                  <p className="text-3xl font-bold mt-1">
                    {materialStats.total}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Yayımlanıb</p>
                  <p className="text-3xl font-bold mt-1">
                    {materialStats.published}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Qaralama</p>
                  <p className="text-3xl font-bold mt-1">
                    {materialStats.unpublished}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Önə çıxarılan
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {materialStats.featured}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-cyan-300" />
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">
              Axtarış və filtrləmə
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Materiallarda axtarış
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder={"Başlıq, təsvir və ya təminatçı üzrə axtar..."}
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kateqoriya
              </label>
              <Select
                value={materialCategoryFilter}
                onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                options={[
                  { value: "all", label: "Bütün kateqoriyalar" },
                  { value: "toolkit", label: "🛠️ Toolkit" },
                  { value: "course", label: "📚 Course" },
                  { value: "video", label: "🎥 Video" },
                  { value: "guide", label: "📖 Guide" },
                  { value: "document", label: "📄 Document" },
                  { value: "emergency", label: "🚨 Emergency" },
                  { value: "other", label: "📦 Other" },
                ]}
                variant="default"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setMaterialSearch("");
                  setMaterialCategoryFilter("all");
                  loadMaterials();
                }}
                variant="secondary"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {"Filtrləri təmizlə"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Material siyahısı ({materials.length})
              </h3>
              <div className="text-sm text-slate-500">
                {materialCategoryFilter !== "all" &&
                  `Filtr: ${materialCategoryFilter}`}
              </div>
            </div>
          </div>

          {tabLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loading size="lg" variant="spinner" color="primary" />
              <span className="ml-3 text-slate-600">
                Materiallar yüklənir...
              </span>
            </div>
          ) : materials.length === 0 ? (
            <EmptyState variant="inline" icon={FileText} title="Material tapılmadı" message="Filterlərə uyğun material təqdimatı yoxdur." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Kateqoriya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Növ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Aktivlik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materials.map((material) => (
                    <tr
                      key={material._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {material.imageUrl && (
                            <Image
                              src={material.imageUrl}
                              alt={material.title}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate max-w-xs">
                              {material.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-md">
                              {material.description}
                            </div>
                            {material.provider && (
                              <div className="text-xs text-slate-400 mt-1">
                                {`təminatçı: ${material.provider}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="primary" size="sm" className="capitalize">
                          {material.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {material.type || "Göstərilməyib"}
                        </div>
                        {material.duration && (
                          <div className="text-xs text-slate-500">
                            {material.duration}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center text-sm text-slate-500">
                            <Eye className="w-4 h-4 mr-1" />
                            {material.views || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggleMaterialPublish(material)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              material.isPublished
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-slate-800 hover:bg-gray-200"
                            }`}
                            title="Yayımlanma statusunu dəyiş"
                          >
                            {material.isPublished ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {"Yayımlanıb"}
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                {"Qaralama"}
                              </>
                            )}
                          </Button>
                          {material.featured && (
                            <Badge variant="primary" size="sm">
                              <Tag className="w-3 h-3 mr-1" />
                              {"Önə çıxarılan"}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggleMaterialFeatured(material)}
                            className={`p-2 rounded-md ${
                              material.featured
                                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                            }`}
                            title={
                              material.featured
                                ? "Önə çıxarılandan sil"
                                : "Önə çıxarılanlara əlavə et"
                            }
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleEditMaterial(material)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                            title="Materialı redaktə et"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setDeleteConfirmMaterial(material)}
                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                            title="Materialı sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showMaterialFormModal && (
        <Modal
          isOpen={showMaterialFormModal}
          onClose={() => {
            setShowMaterialFormModal(false);
            setSelectedMaterial(null);
          }}
          title={selectedMaterial ? "Materialı redaktə et" : "Yeni material əlavə et"}
          size="xl"
          className="max-h-[90vh] overflow-y-auto"
        >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      label={"Başlıq"}
                      value={materialFormData.title || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          title: e.target.value,
                        })
                      }
                      placeholder={"Material başlığı"}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextArea
                      label="Təsvir"
                      value={materialFormData.description || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder={"Materialın ətraflı təsviri"}
                      rows={3}
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <Select
                      label="Kateqoriya"
                      value={materialFormData.category || "other"}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          category: e.target.value as any,
                        })
                      }
                      options={[
                        { value: "toolkit", label: "Alət dəsti" },
                        { value: "course", label: "Kurs" },
                        { value: "video", label: "Video" },
                        { value: "guide", label: "Bələdçi" },
                        { value: "document", label: "Sənəd" },
                        { value: "emergency", label: "Təcili yardım" },
                        { value: "other", label: "Digər" },
                      ]}
                      variant="default"
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      label={"Növ"}
                      value={materialFormData.type || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          type: e.target.value,
                        })
                      }
                      placeholder={"məs., PDF, Video Kursu, İnteraktiv Alət"}
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="url"
                      label={"URL"}
                      value={materialFormData.url || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          url: e.target.value,
                        })
                      }
                      placeholder={"https://example.com/resurs"}
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      label={"Təminatçı"}
                      value={materialFormData.provider || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          provider: e.target.value,
                        })
                      }
                      placeholder={"Təşkilat və ya təminatçı adı"}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      label={"Müddət"}
                      value={materialFormData.duration || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          duration: e.target.value,
                        })
                      }
                      placeholder={"məs., 4 həftə, 30 dəqiqə"}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      label={"Dillər (vergüllə ayrılmış)"}
                      value={materialFormData.language?.join(", ") || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          language: e.target.value
                            .split(",")
                            .map((l) => l.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder={"az, en, ru"}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      label={"Teqlər (vergüllə ayrılmış)"}
                      value={materialFormData.tags?.join(", ") || ""}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder={"gender-bərabərliyi, təhsil, alətlər"}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Input
                      type="number"
                      label={"Sıra"}
                      value={materialFormData.order || 0}
                      onChange={(e) =>
                        setMaterialFormData({
                          ...materialFormData,
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {"Material şəkli"}
                    </label>
                    <ImageUploadContainer
                      value={materialFormData.imageUrl || ""}
                      onChange={(url) =>
                        setMaterialFormData({
                          ...materialFormData,
                          imageUrl: url,
                        })
                      }
                      context="material"
                      maxSize={10}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {"Şəkil yükləyin və ya standart görünüş üçün boş saxlayın"}
                    </p>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={materialFormData.featured || false}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            featured: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {"Önə çıxarılan"}
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={materialFormData.isPublished !== false}
                        onChange={(e) =>
                          setMaterialFormData({
                            ...materialFormData,
                            isPublished: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-green-600 border-slate-200 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {"Yayımlanıb"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-slate-200 p-6 rounded-b-2xl flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowMaterialFormModal(false);
                    setSelectedMaterial(null);
                  }}
                  variant="outline"
                  disabled={isProcessing}
                >
                  {"Ləğv et"}
                </Button>
                <Button
                  onClick={handleSaveMaterial}
                  variant="primary"
                  disabled={isProcessing}
                  loading={isProcessing}
                >
                  {!isProcessing && (
                    <>
                      <Save className="w-4 h-4 mr-2 inline" />
                    </>
                  )}
                  {isProcessing ? "Yadda saxlanılır..." : selectedMaterial ? "Materialı yenilə" : "Material yarat"}
                </Button>
              </div>
        </Modal>
      )}

      <AdminActionModal
        isOpen={Boolean(deleteConfirmMaterial)}
        onClose={() => setDeleteConfirmMaterial(null)}
        title="Materialı sil"
        description={
          deleteConfirmMaterial
            ? `\"${deleteConfirmMaterial.title}\" materialını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`
            : "Bu əməliyyat geri qaytarılmır."
        }
        actions={[
          {
            label: "Sil",
            variant: "danger",
            loading: deletingMaterial,
            disabled: deletingMaterial || !deleteConfirmMaterial,
            onClick: async () => {
              if (!deleteConfirmMaterial?._id) return;
              await handleDeleteMaterial(deleteConfirmMaterial._id);
            },
          },
        ]}
      />
    </AdminListLayout>
    </PageStateGuard>
  );
}
