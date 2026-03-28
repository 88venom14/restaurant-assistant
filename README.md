# Restaurant Assistant

## Запуск проекта

### 1. Установка зависимостей

```bash
npm install

npm run dev
```

#### приложение

```bash
npm run electron:dev
```

Эта команда одновременно запустит Next.js dev-сервер и Electron-приложение.


## Установка готового приложения

1. **Скачайте установщик**
   `Restaurant Assistant Setup 1.0.0.exe` из папки `dist/`

3. **Запустите установщик**

4. **Запустите приложение**

### Использование

```
1. Введите название города (например: "Москва")
2. Получите список ресторанов
3. Нажмите "Показать ещё" для дополнительных результатов
4. Нажмите "Сбросить" для нового поиска
```

---

## 🛠️ Технологии

| Компонент | Технология |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Desktop** | Electron 41 |
| **Стили** | CSS3, CSS Variables |
| **API** | 2GIS Catalog API v3 |
| **Сборка** | electron-builder |

---

## 📦 Структура проекта

```
restaurant-assistant-go-ss/
├── electron/
│   ├── main.js          # Главный процесс Electron
│   └── preload.js       # Preload скрипт
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts    # API endpoint
│   │   ├── globals.css         # Глобальные стили
│   │   ├── layout.tsx          # Корневой layout
│   │   └── page.tsx            # Главная страница
│   ├── components/
│   │   ├── Chat.tsx            # Компонент чата
│   │   ├── MessageBubble.tsx   # Пузырь сообщения
│   │   └── QuickActions.tsx    # Кнопки действий
│   ├── lib/
│   │   ├── 2gis.ts             # 2GIS API клиент
│   │   └── assistant.ts        # Логика бота
│   └── types/
│       └── index.ts            # TypeScript типы
├── dist/
│   ├── Restaurant Assistant Setup 1.0.0.exe  # Установщик
│   └── win-unpacked/
│       └── Restaurant Assistant.exe          # Портативная версия
├── icon.ico                  # Иконка приложения
├── package.json              # Зависимости и скрипты
├── next.config.js            # Конфигурация Next.js
└── README.md                 # Этот файл
```

---

## ⌨️ Скрипты

```bash
# Разработка (веб)
npm run dev

# Сборка (веб)
npm run build

# Запуск (веб)
npm run start

# Разработка (Electron)
npm run electron:dev

# Сборка (Electron .exe)
npm run electron:build:win
```
