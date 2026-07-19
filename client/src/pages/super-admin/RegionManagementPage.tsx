import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regionApi, districtApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/components/ui/toast';
import { PageLoader } from '@/components/ui/loader';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

export function RegionManagementPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [regionDialog, setRegionDialog] = useState(false);
  const [districtDialog, setDistrictDialog] = useState(false);
  const [regionForm, setRegionForm] = useState({ name: '', code: '' });
  const [districtForm, setDistrictForm] = useState({ name: '' });
  const [editingRegion, setEditingRegion] = useState<any>(null);
  const [editingDistrict, setEditingDistrict] = useState<any>(null);

  const { data: regions, isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionApi.list(),
  });

  const { data: districts } = useQuery({
    queryKey: ['districts', selectedRegion?.id],
    queryFn: () => districtApi.list(selectedRegion?.id),
    enabled: !!selectedRegion,
  });

  const regionMutation = useMutation({
    mutationFn: (data: any) =>
      data.id
        ? regionApi.update(data.id, { name: data.name, code: data.code })
        : regionApi.create({ name: data.name, code: data.code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      setRegionDialog(false);
      setRegionForm({ name: '', code: '' });
      setEditingRegion(null);
      addToast('Region saved', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const deleteRegionMutation = useMutation({
    mutationFn: (id: string) => regionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      if (selectedRegion?.id) setSelectedRegion(null);
      addToast('Region deleted', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const districtMutation = useMutation({
    mutationFn: (data: any) =>
      data.id
        ? districtApi.update(data.id, { name: data.name })
        : districtApi.create({ regionId: selectedRegion?.id, name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setDistrictDialog(false);
      setDistrictForm({ name: '' });
      setEditingDistrict(null);
      addToast('District saved', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const deleteDistrictMutation = useMutation({
    mutationFn: (id: string) => districtApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      addToast('District deleted', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <PageLoader />;

  const regionsList = regions?.data || [];
  const districtsList = districts?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.regions')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Regions</CardTitle>
            <Button size="sm" onClick={() => {
              setEditingRegion(null);
              setRegionForm({ name: '', code: '' });
              setRegionDialog(true);
            }}>
              <Plus className="h-4 w-4" /> Add Region
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionsList.map((region: any) => (
                  <TableRow
                    key={region.id}
                    className={`cursor-pointer ${selectedRegion?.id === region.id ? 'bg-primary-50' : ''}`}
                    onClick={() => setSelectedRegion(region)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {region.name}
                    </TableCell>
                    <TableCell><Badge variant="outline">{region.code}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setEditingRegion(region);
                          setRegionForm({ name: region.name, code: region.code });
                          setRegionDialog(true);
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this region?')) deleteRegionMutation.mutate(region.id);
                        }}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {regionsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">No regions</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Districts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Districts
              {selectedRegion && <span className="text-sm font-normal text-slate-500 ml-2">— {selectedRegion.name}</span>}
            </CardTitle>
            {selectedRegion && (
              <Button size="sm" onClick={() => {
                setEditingDistrict(null);
                setDistrictForm({ name: '' });
                setDistrictDialog(true);
              }}>
                <Plus className="h-4 w-4" /> Add District
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!selectedRegion ? (
              <div className="text-center py-12 text-slate-500">Select a region to view districts</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {districtsList.map((district: any) => (
                    <TableRow key={district.id}>
                      <TableCell className="font-medium">{district.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingDistrict(district);
                            setDistrictForm({ name: district.name });
                            setDistrictDialog(true);
                          }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('Delete this district?')) deleteDistrictMutation.mutate(district.id);
                          }}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {districtsList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                        No districts in this region
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Region Dialog */}
      <Dialog open={regionDialog} onOpenChange={setRegionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegion ? 'Edit Region' : 'Add Region'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input label="Name" value={regionForm.name} onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })} />
            <Input label="Code" value={regionForm.code} onChange={(e) => setRegionForm({ ...regionForm, code: e.target.value })} />
            <Button className="w-full" onClick={() => regionMutation.mutate({ ...regionForm, id: editingRegion?.id })} disabled={regionMutation.isPending}>
              {editingRegion ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* District Dialog */}
      <Dialog open={districtDialog} onOpenChange={setDistrictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDistrict ? 'Edit District' : 'Add District'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input label="Name" value={districtForm.name} onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })} />
            <Button className="w-full" onClick={() => districtMutation.mutate({ ...districtForm, id: editingDistrict?.id })} disabled={districtMutation.isPending}>
              {editingDistrict ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
