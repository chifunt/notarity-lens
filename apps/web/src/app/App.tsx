import { Navigate, Route, Routes } from "react-router-dom";
import {
  AnalyzeScreen,
  AppointmentScreen,
  CostScreen,
  CountryScreen,
  EvidenceScreen,
  MobileUploadScreen,
  PlanScreen,
  ReviewScreen,
  StartScreen,
  SuccessScreen,
} from "@/routes/LensScreens";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<StartScreen />} />
      <Route path="/mobile-upload/:sessionId" element={<MobileUploadScreen />} />
      <Route path="/lens/analyze" element={<AnalyzeScreen />} />
      <Route path="/lens/evidence" element={<EvidenceScreen />} />
      <Route path="/lens/country" element={<CountryScreen />} />
      <Route path="/lens/plan" element={<PlanScreen />} />
      <Route path="/lens/cost" element={<CostScreen />} />
      <Route path="/lens/appointment" element={<AppointmentScreen />} />
      <Route path="/lens/review" element={<ReviewScreen />} />
      <Route path="/lens/success" element={<SuccessScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
