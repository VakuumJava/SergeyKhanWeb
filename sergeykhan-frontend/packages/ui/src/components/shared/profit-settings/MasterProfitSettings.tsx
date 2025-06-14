"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Separator } from "@workspace/ui/components/ui";
import { Alert, AlertDescription } from "@workspace/ui/components/ui";
import { Loader2, Save, Trash2, RotateCcw, Settings } from "lucide-react";
import { API } from "@shared/constants/constants";
import axios from "axios";

interface ProfitSettings {
  master_paid_percent: number;
  master_balance_percent: number;
  curator_percent: number;
  company_percent: number;
  is_individual: boolean;
  settings_id?: number | null;
}

interface MasterProfitSettingsProps {
  masterId: string;
  masterName?: string;
  readonly?: boolean;
  onSettingsChange?: (settings: ProfitSettings) => void;
}

export const MasterProfitSettings: React.FC<MasterProfitSettingsProps> = ({
  masterId,
  masterName,
  readonly = false,
  onSettingsChange,
}) => {
  // ──────────── STATE ────────────
  const [settings, setSettings] = useState<ProfitSettings>({
    master_paid_percent: 30,
    master_balance_percent: 30,
    curator_percent: 5,
    company_percent: 35,
    is_individual: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ──────────── HELPERS ────────────
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API}/api/profit-settings/master/${masterId}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      const data = response.data;
      setSettings(data.settings);
      onSettingsChange?.(data.settings);
    } catch (err: any) {
      console.error('Ошибка загрузки настроек:', err);
      setError('Не удалось загрузить настройки прибыли');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Валидация
    const total = settings.master_paid_percent + settings.master_balance_percent + 
                  settings.curator_percent + settings.company_percent;
    
    if (total !== 100) {
      setError(`Сумма всех процентов должна быть 100%. Текущая сумма: ${total}%`);
      setSaving(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API}/api/profit-settings/master/${masterId}/set/`,
        {
          master_paid_percent: settings.master_paid_percent,
          master_balance_percent: settings.master_balance_percent,
          curator_percent: settings.curator_percent,
          company_percent: settings.company_percent,
          is_active: true,
        },
        { headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' } }
      );

      const updatedSettings = { ...settings, is_individual: true, settings_id: response.data.settings.id };
      setSettings(updatedSettings);
      onSettingsChange?.(updatedSettings);
      setSuccess('Индивидуальные настройки успешно сохранены!');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Ошибка сохранения настроек:', err);
      setError(err.response?.data?.error || 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const deleteSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.delete(
        `${API}/api/profit-settings/master/${masterId}/delete/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      // Перезагружаем настройки (должны вернуться глобальные)
      await fetchSettings();
      setSuccess('Индивидуальные настройки удалены. Используются глобальные настройки.');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Ошибка удаления настроек:', err);
      setError(err.response?.data?.error || 'Не удалось удалить настройки');
    } finally {
      setSaving(false);
    }
  };

  // ──────────── EFFECTS ────────────
  useEffect(() => {
    fetchSettings();
  }, [masterId]);

  // ──────────── HANDLERS ────────────
  const handleInputChange = (field: keyof ProfitSettings, value: number) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    setError(null);
    setSuccess(null);
  };

  // ──────────── COMPUTED ────────────
  const totalPercent = settings.master_paid_percent + settings.master_balance_percent + 
                       settings.curator_percent + settings.company_percent;
  const totalMasterPercent = settings.master_paid_percent + settings.master_balance_percent;
  const isValidTotal = totalPercent === 100;

  // ──────────── RENDER ────────────
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки распределения прибыли
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Загрузка настроек...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Настройки распределения прибыли
              {masterName && <span className="text-sm font-normal text-muted-foreground">для {masterName}</span>}
            </CardTitle>
            <CardDescription>
              {settings.is_individual ? (
                <Badge variant="secondary" className="mt-1">
                  Индивидуальные настройки
                </Badge>
              ) : (
                <Badge variant="outline" className="mt-1">
                  Глобальные настройки
                </Badge>
              )}
            </CardDescription>
          </div>
          
          {!readonly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSettings}
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              {settings.is_individual && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSettings}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Настройки процентов */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Мастеру к выплате (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.master_paid_percent}
              onChange={(e) => handleInputChange('master_paid_percent', parseInt(e.target.value) || 0)}
              disabled={readonly || saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Мастеру на баланс (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.master_balance_percent}
              onChange={(e) => handleInputChange('master_balance_percent', parseInt(e.target.value) || 0)}
              disabled={readonly || saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Куратору (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.curator_percent}
              onChange={(e) => handleInputChange('curator_percent', parseInt(e.target.value) || 0)}
              disabled={readonly || saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Компании (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.company_percent}
              onChange={(e) => handleInputChange('company_percent', parseInt(e.target.value) || 0)}
              disabled={readonly || saving}
            />
          </div>
        </div>

        <Separator />

        {/* Итоговая информация */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Всего мастеру:</span>
            <span className="font-medium">{totalMasterPercent}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Общая сумма:</span>
            <span className={`font-medium ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercent}%
            </span>
          </div>
          {!isValidTotal && (
            <p className="text-xs text-red-600">
              Сумма должна быть равна 100%
            </p>
          )}
        </div>

        {/* Кнопки действий */}
        {!readonly && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={saveSettings}
              disabled={saving || !isValidTotal}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {settings.is_individual ? 'Обновить настройки' : 'Создать индивидуальные настройки'}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
