import * as React from 'react';
import ReactDOM from "react-dom";
import * as ReactDOMClient from 'react-dom/client';
import { QuadTreeDemo } from './QuadTreeDemo.js';

const root = ReactDOMClient.createRoot(document.getElementById("root") as HTMLElement);
root.render(<QuadTreeDemo />);