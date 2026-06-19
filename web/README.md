# React + TypeScript + Vite + React Bootstrap

This is a template for a new Vite project with React, TypeScript, and React Bootstrap.

## Using Components

To use the components in your app, import them directly from `react-bootstrap`:

```tsx
import Button from 'react-bootstrap/Button';
// Or
import { Button } from 'react-bootstrap';
```

## Styling and Themes

Bootstrap CSS is loaded globally in `src/main.tsx`:

```tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
```

Press the shortcut key `l` to toggle dark/light mode context. Custom classes are defined in `src/index.css`.
