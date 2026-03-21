import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/api/client';
import { deleteAccount, exportMyData } from '@/api/account';
import { Download, Trash2, User, Mail, Phone, MapPin, Building2, Shield } from 'lucide-react';
import axios from 'axios';

interface ClientProfileData {
  id: number;
  name: string;
  phone: string | null;
  parish: string | null;
  municipality: string | null;
  island: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ProviderProfileData {
  id: number;
  companyName: string;
  nif: string | null;
  phone: string | null;
  description: string | null;
  serviceRadiusKm: number | null;
  avgRating: number | null;
  totalReviews: number | null;
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
}

type ProfileData = ClientProfileData | ProviderProfileData;

function isProviderProfile(profile: ProfileData): profile is ProviderProfileData {
  return 'companyName' in profile;
}

function formatLocation(parish: string | null, municipality: string | null, island: string | null): string {
  const parts = [parish, municipality, island].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '--';
}

export function Profile() {
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const user = useAuthStore((s) => s.user);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const response = await apiClient.get<ProfileData>('/profile/me');
      return response.data;
    },
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportMyData();
      toast.success('Dados exportados com sucesso.');
    } catch {
      toast.error('Erro ao exportar dados.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleOpenDeleteModal() {
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  }

  function handleCloseDeleteModal() {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteError('');
  }

  async function handleDeleteAccount() {
    if (!deletePassword.trim()) {
      setDeleteError('Introduza a sua palavra-passe.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount(deletePassword);
      useAuthStore.getState().logout();
      toast.success('Conta eliminada com sucesso.');
      navigate('/');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setDeleteError('Palavra-passe incorreta.');
      } else {
        setDeleteError('Erro ao eliminar conta. Tente novamente.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AnimatedPage>
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-4" />}

      <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
        Perfil
      </h1>

      {/* Section 1: Profile Info */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-neutral-800">
            Informacao do Perfil
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton.Line className="h-3 w-20" />
                  <Skeleton.Line className="h-5 w-40" />
                </div>
              ))}
            </div>
          </div>
        ) : profile ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {isProviderProfile(profile) ? (
                <>
                  <ProfileField
                    icon={<Building2 className="h-4 w-4 text-neutral-400" />}
                    label="Empresa"
                    value={profile.companyName}
                  />
                  <ProfileField
                    icon={<Shield className="h-4 w-4 text-neutral-400" />}
                    label="NIF"
                    value={profile.nif ?? '--'}
                  />
                  <ProfileField
                    icon={<Mail className="h-4 w-4 text-neutral-400" />}
                    label="Email"
                    value={user?.email ?? '--'}
                  />
                  <ProfileField
                    icon={<Phone className="h-4 w-4 text-neutral-400" />}
                    label="Telefone"
                    value={profile.phone ?? '--'}
                  />
                </>
              ) : (
                <>
                  <ProfileField
                    icon={<User className="h-4 w-4 text-neutral-400" />}
                    label="Nome"
                    value={profile.name}
                  />
                  <ProfileField
                    icon={<Mail className="h-4 w-4 text-neutral-400" />}
                    label="Email"
                    value={user?.email ?? '--'}
                  />
                  <ProfileField
                    icon={<Phone className="h-4 w-4 text-neutral-400" />}
                    label="Telefone"
                    value={profile.phone ?? '--'}
                  />
                  <ProfileField
                    icon={<MapPin className="h-4 w-4 text-neutral-400" />}
                    label="Localizacao"
                    value={formatLocation(profile.parish, profile.municipality, profile.island)}
                  />
                </>
              )}
            </div>

            {isProviderProfile(profile) && profile.description && (
              <div className="mt-5 pt-5 border-t border-neutral-100">
                <p className="text-sm font-medium text-neutral-500 mb-1">Descricao</p>
                <p className="text-sm text-neutral-700">{profile.description}</p>
              </div>
            )}

            <p className="text-xs text-neutral-400 mt-5">
              Para editar o seu perfil, contacte o suporte.
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            Nao foi possivel carregar os dados do perfil.
          </p>
        )}
      </div>

      {/* Section 2: GDPR */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-neutral-800">
            Dados Pessoais e Privacidade
          </h2>
        </div>

        <p className="text-sm text-neutral-600 mb-5">
          Em conformidade com o RGPD, pode exportar ou eliminar os seus dados pessoais a qualquer momento.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            loading={isExporting}
          >
            <Download className="h-4 w-4" />
            Exportar os meus dados
          </Button>

          <Button
            variant="danger"
            onClick={handleOpenDeleteModal}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar conta
          </Button>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal open={showDeleteModal} onClose={handleCloseDeleteModal} title="Eliminar conta" size="sm">
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700 font-medium">
              Esta acao e irreversivel. Todos os seus dados pessoais serao eliminados permanentemente.
            </p>
          </div>

          <div>
            <label htmlFor="delete-password" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Confirme a sua palavra-passe
            </label>
            <input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                if (deleteError) setDeleteError('');
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Palavra-passe"
              autoComplete="current-password"
            />
            {deleteError && (
              <p className="mt-1.5 text-sm text-red-600">{deleteError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={handleCloseDeleteModal}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={isDeleting}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}

interface ProfileFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function ProfileField({ icon, label, value }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <p className="text-sm text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
