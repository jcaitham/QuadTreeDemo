import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { QuadTreeDemo } from './QuadTreeDemo.js';
import "./index.scss";
const root = ReactDOMClient.createRoot(document.getElementById("root"));
root.render(React.createElement(QuadTreeDemo, null));
