"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@workspace/ui/components/ui';
import { Button } from '@workspace/ui/components/ui';
import { Input } from '@workspace/ui/components/ui';
import { API } from '@shared/constants/constants';

interface IUser {
    id: string;
    email: string;
    name?: string;
    login?: string;
    password?: string;
    balance?: number;
    role?: string;
}

const BalanceManagement = () => {
    const [userId, setUserId] = useState<string>('');
    const [user, setUser] = useState<IUser | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [newBalance, setNewBalance] = useState<string>('');
    const [delta, setDelta] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Поиск пользователя по ID + подхват баланса
    const handleSearch = async () => {
        setError(null);
        setUser(null);
        if (!userId.trim()) return;
        const token = localStorage.getItem('token');
        try {
            // 1️⃣ GET /users/:id/
            const res = await fetch(`${API}/users/${userId}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                setError('Пользователь не найден');
                return;
            }
            const data: IUser = await res.json();

            // 2️⃣ GET /balance/:id/
            const balRes = await fetch(`${API}/balance/${userId}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (balRes.ok) {
                const balJson = await balRes.json(); // { balance: number }
                data.balance = balJson.balance;
            } else {
                // если баланс не вернулся, можно вывести 0 или оставить undefined
                data.balance = 0;
            }

            setUser(data);
        } catch (err) {
            console.error(err);
            setError('Ошибка при запросе');
        }
    };

    // При открытии диалога подставляем текущий баланс
    useEffect(() => {
        if (dialogOpen && user?.balance != null) {
            setNewBalance(String(user.balance));
            setDelta('');
        }
    }, [dialogOpen, user]);

    // Логика сохранения: выбираем endpoint и обновляем UI
    const handleBalanceUpdate = async () => {
        if (!user || newBalance === '') return;
        setError(null);
        const token = localStorage.getItem('token');
        const current = user.balance ?? 0;
        const updated = parseFloat(newBalance);
        if (isNaN(updated)) {
            setError('Неверный формат баланса');
            return;
        }
        const diff = updated - current;
        if (diff === 0) {
            setDialogOpen(false);
            return;
        }
        const action = diff > 0 ? 'top-up' : 'deduct';
        try {
            const res = await fetch(
              `${API}/balance/${user.id}/${action}/`,
              {
                  method: 'POST',
                  headers: {
                      Authorization: `Token ${token}`,
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      amount: Math.abs(diff),
                      note: '',
                  }),
              }
            );
            const text = await res.text();
            if (!res.ok) {
                console.error('Error', res.status, text);
                // пытаемся распарсить JSON { error: '...' } или { detail: '...' }
                try {
                    const json = JSON.parse(text);
                    setError(json.error || json.detail || `Ошибка ${res.status}`);
                } catch {
                    setError(`Ошибка ${res.status}: ${text}`);
                }
                return;
            }
            // перезагружаем баланс
            const balRes = await fetch(`${API}/balance/${user.id}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (balRes.ok) {
                const { balance } = await balRes.json();
                setUser({ ...user, balance });
                setDialogOpen(false);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Сетевая ошибка при обновлении');
        }
    };

    return (
      <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Управление балансом</h2>

          <div className="mb-4 flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Введите ID пользователя"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <Button onClick={handleSearch}>Поиск</Button>
          </div>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          {user && (
            <div className="border p-4 rounded space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.name   && <p><strong>Имя:</strong> {user.name}</p>}
                {user.login  && <p><strong>Логин:</strong> {user.login}</p>}
                {user.role   && <p><strong>Роль:</strong> {user.role}</p>}
                <p><strong>Баланс:</strong> {user.balance} ₸</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-2">
                    Изменить баланс
                </Button>
            </div>
          )}

          {/* Диалог изменения баланса */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Изменение баланса</DialogTitle>
                  </DialogHeader>

                  {/* Поле «Новый баланс» с тенге */}
                  <div className="my-4 relative">
                      <Input
                        type="number"
                        placeholder="Новый баланс"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₸</span>
                  </div>

                  {/* Поле «Сумма изменения» осталось без изменений */}
                  <div className="my-4 flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Сумма изменения"
                        value={delta}
                        onChange={(e) => setDelta(e.target.value)}
                      />
                      <Button onClick={() => {
                          const c = parseFloat(newBalance);
                          const d = parseFloat(delta);
                          if (!isNaN(c) && !isNaN(d)) setNewBalance(String(c - d));
                      }} variant="outline">
                          Уменьшить
                      </Button>
                      <Button onClick={() => {
                          const c = parseFloat(newBalance);
                          const d = parseFloat(delta);
                          if (!isNaN(c) && !isNaN(d)) setNewBalance(String(c + d));
                      }} variant="outline">
                          Увеличить
                      </Button>
                  </div>

                  {error && <p className="text-red-500 mb-2">{error}</p>}
                  <DialogFooter>
                      <Button onClick={handleBalanceUpdate}>Сохранить</Button>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Отмена
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </div>
    );
};

export default BalanceManagement;