import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Collection from "../pages/Collection";
import CollectionDetail from "../pages/CollectionDetail";
import StreakPage from "../pages/Streak";
import FlashcardSetsPage from "../pages/Flashcard";
import FlashcardPracticePage from "../pages/FlashcardMode";
import CreateFlashcardSetPage from "../pages/CreateFlashcardSetPage";
import KanaLessonsPage from "../pages/KanaLessonsPage";
import KanaPracticePage from "../pages/KanaPracticePage";
import KanaLessonDetailPage from "../pages/KanaLessonDetailPage";
import KanaTestPage from "../pages/KanaTestPage";
import TopicListPage from "../pages/TopicListPage";
import GroupDetailPage from "../pages/GroupDetailPage";
import SmartReviewPage from "../pages/SmartReviewPage";

// Import Admin
import { AdminRoute } from "../routers/AdminRoute";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import VocabularyManagement from "../pages/Admin/VocabularyManagement";
import AdminLayout from "../layouts/AdminLayout";
import LessonManagement from "../pages/Admin/LessonManagement";
import KanjiManagement from "../pages/Admin/KanjiManagement";
import UserManagement from "../pages/Admin/UserManagement";
import KanjiTestPage from "../pages/KanjiTestPage"; // thêm dòng này

// === Các trang Kanji (dùng chung component hoặc tạo mới) ===
// Nếu bạn đã tạo component riêng như KanjiLessonsPage, KanjiPracticePage, import ở đây
// Tạm thời dùng KanaLessonsPage và KanaPracticePage vì chúng đã hỗ trợ cả Kanji
// import KanjiLessonsPage from "../pages/KanjiLessonsPage";
// import KanjiPracticePage from "../pages/KanjiPracticePage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ================= ROUTES CÔNG KHAI ================= */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/collection/:id" element={<CollectionDetail />} />
      <Route path="/streak" element={<StreakPage />} />
      <Route path="/flashcard" element={<FlashcardSetsPage />} />
      <Route path="/flashcard/create" element={<CreateFlashcardSetPage />} />
      <Route path="/flashcard/smart-review" element={<SmartReviewPage />} />
      <Route path="/flashcard/:id" element={<FlashcardPracticePage />} />

      {/* === ROUTES KANA === */}
      <Route path="/kana-lessons" element={<KanaLessonsPage />} />
      <Route path="/kana-lesson/:lessonId" element={<KanaLessonDetailPage />} />
      <Route
        path="/kana-practice/:id"
        element={<KanaPracticePage type="kana" />}
      />

      <Route path="/kana-test/:lessonId" element={<KanaTestPage />} />

      {/* === ROUTES KANJI === */}
      <Route path="/kanji-lessons" element={<KanaLessonsPage />} />
      <Route
        path="/kanji-lesson/:lessonId"
        element={<KanaLessonDetailPage />}
      />
      <Route path="/kanji-practice/:id" element={<KanaPracticePage type="kanji" />} />
      <Route path="/kanji-test/:lessonId" element={<KanjiTestPage />} />

      <Route path="/topics" element={<TopicListPage />} />
      <Route
        path="/vocabulary/group/:groupName"
        element={<GroupDetailPage />}
      />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ================= ROUTES ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="vocabularies" element={<VocabularyManagement />} />
        <Route path="lessons" element={<LessonManagement />} />
        <Route path="kanjis" element={<KanjiManagement />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* Điều hướng mặc định */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
