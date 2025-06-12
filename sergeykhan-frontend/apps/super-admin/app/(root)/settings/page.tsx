"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Textarea } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { PlusCircle, Trash2 } from "lucide-react";

const SettingsPage = () => {
  const [services, setServices] = React.useState([
    { id: 1, name: "Ремонт", description: "Услуги по ремонту техники" },
    { id: 2, name: "Установка", description: "Установка оборудования" },
  ]);

  const [contactInfo, setContactInfo] = React.useState({
    phone: "+7 (999) 123-45-67",
    email: "info@example.com"
  });

  const addNewService = () => {
    const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
    setServices([...services, { id: newId, name: "", description: "" }]);
  };

  const removeService = (id: number) => {
    setServices(services.filter(service => service.id !== id));
  };

  const handleServiceChange = (id: number, field: string, value: string) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const handleContactChange = (field: string, value: string) => {
    setContactInfo({ ...contactInfo, [field]: value });
  };

  const handleSaveServices = () => {
    console.log("Сохранение услуг:", services);
    // Здесь будет логика сохранения услуг
  };

  const handleSaveContacts = () => {
    console.log("Сохранение контактной информации:", contactInfo);
    // Здесь будет логика сохранения контактной информации
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Настройки</h1>
      
      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Услуги</TabsTrigger>
          <TabsTrigger value="contacts">Контактная информация</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Управление услугами</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex flex-col space-y-2 border p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Услуга #{service.id}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeService(service.id)}
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium">Название услуги</label>
                        <Input 
                          value={service.name} 
                          onChange={(e) => handleServiceChange(service.id, 'name', e.target.value)}
                          placeholder="Введите название услуги"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Описание услуги</label>
                        <Textarea 
                          value={service.description} 
                          onChange={(e) => handleServiceChange(service.id, 'description', e.target.value)}
                          placeholder="Введите описание услуги"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button onClick={addNewService} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Добавить услугу
                </Button>
                
                <Button onClick={handleSaveServices} className="mt-4 w-full">
                  Сохранить изменения
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Номер телефона</label>
                  <Input 
                    value={contactInfo.phone} 
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    placeholder="Введите номер телефона"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Электронная почта</label>
                  <Input 
                    value={contactInfo.email} 
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    placeholder="Введите адрес электронной почты"
                  />
                </div>
                
                <Button onClick={handleSaveContacts} className="mt-4 w-full">
                  Сохранить изменения
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
