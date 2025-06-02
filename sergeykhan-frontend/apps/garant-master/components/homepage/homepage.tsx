import React from 'react';

const HomePage = () => {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Гарантийный мастер</h1>

            <h2 className="text-xl font-semibold mt-6 mb-2">Условия:</h2>
            <ul className="list-disc pl-6 mb-6">
                <li>Приходит на заказ, если что-то сломалось мастером.</li>
                <li>Назначается куратором.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2">Права:</h2>
            <ul className="list-disc pl-6 mb-6">
                <li>Убавлять и добавлять мастеру по его ID.</li>
                <li>
                    Имеет свой баланс и забирает ту сумму, которая должна была быть у мастера при поломке по гарантии.
                </li>
                <li>Может закрыть заказ в вкладке “перезавершить заказы”.</li>
            </ul>

            <p className="mb-6">
                Нажав на кнопку “перезавершить заказы”, он вводит айди заказа и тем самым может закрыть конкретный заказ.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Действия при закрытии заказа:</h2>
            <ul className="list-disc pl-6 mb-6">
                <li>Фото с тем, что он исправил.</li>
                <li>Описание того, что исправил.</li>
                <li>Сумма, которую он вычел с мастера.</li>
                <li>В чем была ошибка мастера.</li>
                <li>
                    Остальная информация вставляется с формы, заполненной мастером после закрытия заказа.
                </li>
            </ul>
        </div>
    );
};

export default HomePage;
