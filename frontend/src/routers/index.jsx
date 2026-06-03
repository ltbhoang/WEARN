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
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/collection/:id" element={<CollectionDetail />} />
      <Route path="/streak" element={<StreakPage />} />
      <Route path="/flashcard" element={<FlashcardSetsPage />} />
      <Route path="/flashcard/create" element={<CreateFlashcardSetPage />} />
      <Route path="/flashcard/:id" element={<FlashcardPracticePage />} />
      <Route path="/kana-lessons" element={<KanaLessonsPage />} />
      <Route path="/kana-lesson/:lessonId" element={<KanaLessonDetailPage />} />
      <Route path="/kana-practice/:kanaId" element={<KanaPracticePage />} />
      <Route path="/kana-test/:lessonId" element={<KanaTestPage />} />
      <Route path="/topics" element={<TopicListPage />} />
      <Route path="/vocabulary/group/:groupName" element={<GroupDetailPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
