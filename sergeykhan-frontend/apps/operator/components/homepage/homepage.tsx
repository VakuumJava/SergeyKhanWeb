import React from 'react';

const Homepage = () => {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Панель Оператора</h1>
            <p className="mb-6">Оператор управляет заявками клиентов, совершает звонки и формирует заказы.</p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Функции оператора:</h2>
            <ul className="list-disc pl-6 mb-6">
                <li>Просматривает список необзвоненных клиентов.</li>
                <li>Совершает звонки и переводит клиента в статус "Закрытый клиент".</li>
                <li>Заполняет форму заказа с данными клиента (ФИО, услуга, время).</li>
                <li>Указывает адрес заказчика (адрес скрыт от мастера, пока он не принял заказ).</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2">Разделы панели:</h2>
            <ul className="list-disc pl-6 mb-6">
                <li><strong>Необзвоненные клиенты</strong> – список заявок, которые еще не обработаны.</li>
                <li><strong>Форма заказа</strong> – ввод информации о клиенте и услуге.</li>
                <li><strong>Закрытые клиенты</strong> – список клиентов, с которыми завершена работа.</li>
            </ul>
        </div>
    );
};

export default Homepage;