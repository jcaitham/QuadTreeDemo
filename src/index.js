import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { QuadTreeDemo } from './QuadTreeDemo.js';
const root = ReactDOMClient.createRoot(document.getElementById("root"));
root.render(React.createElement(QuadTreeDemo, null));
