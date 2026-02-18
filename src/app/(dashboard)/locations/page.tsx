"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

interface Location {
  id: string;
  name: string;
  address: string;
  status: "active" | "inactive";
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addStatus, setAddStatus] = useState<"active" | "inactive">("active");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  async function fetchLocations() {
    setLoading(true);
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch {
      toast.error("Не удалось загрузить кофейни");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      toast.error("Введите название кофейни");
      return;
    }

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          address: addAddress,
          status: addStatus,
        }),
      });

      if (res.ok) {
        toast.success("Кофейня добавлена");
        setAddOpen(false);
        setAddName("");
        setAddAddress("");
        setAddStatus("active");
        fetchLocations();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Ошибка при создании");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Введите название кофейни");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          address: editAddress,
          status: editStatus,
        }),
      });

      if (res.ok) {
        toast.success("Кофейня обновлена");
        setEditOpen(false);
        fetchLocations();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Ошибка при обновлении");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Кофейня удалена");
        setDeleteId(null);
        fetchLocations();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Ошибка при удалении");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openEditDialog = (location: Location) => {
    setEditId(location.id);
    setEditName(location.name);
    setEditAddress(location.address);
    setEditStatus(location.status);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader title="Кофейни" description="Управление вашими кофейнями">
        {/* Add Location Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить кофейню
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая кофейня</DialogTitle>
              <DialogDescription>
                Заполните информацию о новой кофейне
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  placeholder="Название кофейни"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Адрес</Label>
                <Input
                  placeholder="Адрес кофейни"
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={addStatus} onValueChange={(v) => setAddStatus(v as "active" | "inactive")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активна</SelectItem>
                    <SelectItem value="inactive">Неактивна</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addSubmitting}>
                  {addSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Создать
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Locations Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0 py-0">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center gap-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Нет кофеен</p>
              <p className="text-sm text-muted-foreground">
                Добавьте первую кофейню для начала работы
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{location.name}</CardTitle>
                      {location.address && (
                        <p className="text-sm text-muted-foreground">
                          {location.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={location.status === "active" ? "default" : "secondary"}
                  >
                    {location.status === "active" ? "Активна" : "Неактивна"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(location)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Изменить
                  </Button>

                  <Dialog
                    open={deleteId === location.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(location.id)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Удалить
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Удалить кофейню?</DialogTitle>
                        <DialogDescription>
                          Вы уверены, что хотите удалить &laquo;{location.name}&raquo;?
                          Это действие необратимо.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteId(null)}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={deleteSubmitting}
                          onClick={() => handleDelete(location.id)}
                        >
                          {deleteSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Удалить
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать кофейню</DialogTitle>
            <DialogDescription>
              Измените информацию о кофейне
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                placeholder="Название кофейни"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес</Label>
              <Input
                placeholder="Адрес кофейни"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as "active" | "inactive")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активна</SelectItem>
                  <SelectItem value="inactive">Неактивна</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
