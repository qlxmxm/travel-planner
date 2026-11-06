// [공통] 라우팅 지도. 새 페이지를 추가할 때만 여기를 수정하고, 수정 전에 팀에 알려주세요.
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import TripListPage from './pages/trips/TripListPage.jsx';
import TripCreatePage from './pages/trips/TripCreatePage.jsx';
import TripDetailPage from './pages/trips/TripDetailPage.jsx';
import JournalListPage from './pages/journals/JournalListPage.jsx';
import JournalWritePage from './pages/journals/JournalWritePage.jsx';
import JournalDetailPage from './pages/journals/JournalDetailPage.jsx';
import PlaceListPage from './pages/places/PlaceListPage.jsx';
import PlaceDetailPage from './pages/places/PlaceDetailPage.jsx';
import PlacesTab from './pages/places/PlacesTab.jsx';
import ScheduleTab from './pages/schedule/ScheduleTab.jsx';
import BudgetTab from './pages/budget/BudgetTab.jsx';
import MembersTab from './pages/members/MembersTab.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 로그인이 필요한 화면 (ProtectedRoute는 지금은 항상 통과) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/trips" element={<TripListPage />} />
          <Route path="/trips/new" element={<TripCreatePage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />}>
            <Route index element={<ScheduleTab />} />
            <Route path="budget" element={<BudgetTab />} />
            <Route path="places" element={<PlacesTab />} />
            <Route path="members" element={<MembersTab />} />
          </Route>
        </Route>

        <Route path="/journals" element={<JournalListPage />} />
        <Route path="/journals/new" element={<JournalWritePage />} />
        <Route path="/journals/new/from/:tripId" element={<JournalWritePage />} />
        <Route path="/journals/:journalId/edit" element={<JournalWritePage />} />
        <Route path="/journals/:journalId" element={<JournalDetailPage />} />

        <Route path="/places" element={<PlaceListPage />} />
        <Route path="/places/:placeId" element={<PlaceDetailPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
