'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { useForm } from 'react-hook-form';

interface Abonent {
  FirstName: string;
  LastName: string;
  MobileNumber: string;
  InternalNumber: string;
  Department: string;
  Post: string;
  Email: string;
}

interface AbonentEnum {
  ID: string;
  Name: string;
}

const defaultAbonent = {
  ID: 0,
  ProfileID: '',
  Name: '',
  FirstName: '',
  LastName: '',
  Post: '',
  MobileNumber: '',
  DepartmentID: '',
  Email: '',
};

const AbonentsPage: React.FC = () => {
  const [abonents, setAbonents] = useState<Abonent[]>([]);
  const [abonentEnums, setAbonentEnums] = useState<AbonentEnum[]>([]);
  const [selectedAbonent, setSelectedAbonent] = useState<any>(null);
  const [abonentInfo, setAbonentInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: defaultAbonent });

  useEffect(() => {
    async function fetchAbonents() {
      try {
        const response = await fetch('/api/abonents?profileID=1');
        const result = await response.json();
        setAbonents(result.Data || []);
      } catch (error) {
        console.error('Failed to fetch abonents:', error);
      }
    }
    async function fetchAbonentEnums() {
      try {
        const response = await fetch('/api/abonents-enum?profileID=1');
        const result = await response.json();
        // API может вернуть объект, а не массив
        if (Array.isArray(result)) {
          setAbonentEnums(result);
        } else if (Array.isArray(result?.Data)) {
          setAbonentEnums(result.Data);
        } else {
          setAbonentEnums([]);
        }
      } catch (error) {
        console.error('Failed to fetch abonents enum:', error);
        setAbonentEnums([]);
      }
    }
    fetchAbonents();
    fetchAbonentEnums();
  }, []);

  const handleEnumClick = async (id: string) => {
    setSelectedAbonent(id);
    setLoadingInfo(true);
    setAbonentInfo(null);
    try {
      const response = await fetch(`/api/abonent-get?id=${id}`);
      const result = await response.json();
      setAbonentInfo(result.Item || null);
    } catch (error) {
      setAbonentInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSearch = async () => {
    setSearchError('');
    setSelectedAbonent(searchId);
    setLoadingInfo(true);
    setAbonentInfo(null);
    if (!searchId) {
      setSearchError('Введите ID абонента');
      setLoadingInfo(false);
      return;
    }
    try {
      const response = await fetch(`/api/abonent-get?id=${searchId}`);
      const result = await response.json();
      if (result.Item) {
        setAbonentInfo(result.Item);
      } else {
        setAbonentInfo(null);
        setSearchError('Абонент не найден');
      }
    } catch (error) {
      setAbonentInfo(null);
      setSearchError('Ошибка запроса');
    } finally {
      setLoadingInfo(false);
    }
  };

  const fetchAll = useCallback(() => {
    // обновить обе таблицы
    async function fetchAbonents() {
      try {
        const response = await fetch('/api/abonents?profileID=1');
        const result = await response.json();
        setAbonents(result.Data || []);
      } catch (error) {
        console.error('Failed to fetch abonents:', error);
      }
    }
    async function fetchAbonentEnums() {
      try {
        const response = await fetch('/api/abonents-enum?profileID=1');
        const result = await response.json();
        // API может вернуть объект, а не массив
        if (Array.isArray(result)) {
          setAbonentEnums(result);
        } else if (Array.isArray(result?.Data)) {
          setAbonentEnums(result.Data);
        } else {
          setAbonentEnums([]);
        }
      } catch (error) {
        console.error('Failed to fetch abonents enum:', error);
        setAbonentEnums([]);
      }
    }
    fetchAbonents();
    fetchAbonentEnums();
  }, []);

  const handleDelete = async (idToDelete?: string) => {
    setDeleteError('');
    setDeleteSuccess('');
    setDeleting(true);
    const id = idToDelete || deleteId;
    if (!id) {
      setDeleteError('Введите ID абонента');
      setDeleting(false);
      return;
    }
    try {
      const response = await fetch('/api/abonent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (response.ok) {
        setDeleteSuccess('Абонент успешно удалён');
        fetchAll();
      } else {
        setDeleteError(result.error || 'Ошибка удаления');
      }
    } catch (error) {
      setDeleteError('Ошибка запроса');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (data: any) => {
    setSaveError('');
    setSaveSuccess('');
    setSaving(true);
    try {
      const response = await fetch('/api/abonent-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: data }),
      });
      const result = await response.json();
      if (response.ok) {
        setSaveSuccess('Абонент успешно сохранён');
        fetchAll();
        reset(defaultAbonent);
      } else {
        setSaveError(result.error || 'Ошибка сохранения');
      }
    } catch (error) {
      setSaveError('Ошибка запроса');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col md:flex-row gap-8">
      <div className="w-full mb-6 md:mb-0 md:w-1/2">
        <div className="flex items-end gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Поиск по ID абонента</label>
            <Input
              type="number"
              placeholder="Введите ID..."
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleSearch} className="h-9">Найти</Button>
        </div>
        {searchError && <div className="text-red-500 text-sm mb-2">{searchError}</div>}
        {loadingInfo && selectedAbonent === searchId && <div className="mb-2">Загрузка...</div>}
        {abonentInfo && selectedAbonent === searchId && (
          <div className="mb-4 p-4 border rounded bg-background">
            <div className="font-semibold mb-2">Информация об абоненте:</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(abonentInfo, null, 2)}</pre>
          </div>
        )}
        <div className="flex items-end gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Удалить по ID абонента</label>
            <Input
              type="number"
              placeholder="Введите ID..."
              value={deleteId}
              onChange={e => setDeleteId(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={() => handleDelete()} className="h-9" variant="destructive" disabled={deleting}>Удалить</Button>
        </div>
        {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
        {deleteSuccess && <div className="text-green-600 text-sm mb-2">{deleteSuccess}</div>}
        <form onSubmit={handleSubmit(handleSave)} className="mb-6 p-4 border rounded bg-background flex flex-col gap-2">
          <div className="font-semibold mb-2">Добавить/редактировать абонента</div>
          <input {...register('ID')} type="number" placeholder="ID (0 для нового)" className="border rounded px-2 py-1" />
          <input {...register('ProfileID')} type="number" placeholder="ProfileID" className="border rounded px-2 py-1" />
          <input {...register('Name')} placeholder="Name" className="border rounded px-2 py-1" />
          <input {...register('FirstName')} placeholder="FirstName" className="border rounded px-2 py-1" />
          <input {...register('LastName')} placeholder="LastName" className="border rounded px-2 py-1" />
          <input {...register('Post')} placeholder="Post" className="border rounded px-2 py-1" />
          <input {...register('MobileNumber')} placeholder="MobileNumber" className="border rounded px-2 py-1" />
          <input {...register('DepartmentID')} type="number" placeholder="DepartmentID" className="border rounded px-2 py-1" />
          <input {...register('Email')} placeholder="Email" className="border rounded px-2 py-1" />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 mt-2" disabled={saving}>Сохранить</button>
          {saveError && <div className="text-red-500 text-sm">{saveError}</div>}
          {saveSuccess && <div className="text-green-600 text-sm">{saveSuccess}</div>}
        </form>
      </div>
      <div className="flex-1">
        <h1 className="text-xl font-bold mb-4">Абоненты</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Фамилия</TableHead>
              <TableHead>Мобильный</TableHead>
              <TableHead>Внутренний</TableHead>
              <TableHead>Отдел</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Email</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abonents.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.FirstName}</TableCell>
                <TableCell>{item.LastName}</TableCell>
                <TableCell>{item.MobileNumber}</TableCell>
                <TableCell>{item.InternalNumber}</TableCell>
                <TableCell>{item.Department}</TableCell>
                <TableCell>{item.Post}</TableCell>
                <TableCell>{item.Email}</TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(item.InternalNumber)} disabled={deleting}>Удалить</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold mb-4">Словарь абонентов</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Имя</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abonentEnums.map((item, idx) => (
              <TableRow
                key={idx}
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleEnumClick(item.ID)}
                style={{ background: selectedAbonent === item.ID ? '#f3f4f6' : undefined }}
              >
                <TableCell>{item.ID}</TableCell>
                <TableCell>{item.Name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loadingInfo && <div className="mt-4">Загрузка...</div>}
        {abonentInfo && (
          <div className="mt-4 p-4 border rounded bg-background">
            <div className="font-semibold mb-2">Информация об абоненте:</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(abonentInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbonentsPage;
