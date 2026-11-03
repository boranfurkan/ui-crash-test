import { createRoot } from 'react-dom/client';
import { FixtureView } from './FixtureView.tsx';
import { Dashboard } from './Dashboard.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(location.pathname === '/fixture' ? <FixtureView/> : <Dashboard/>);
