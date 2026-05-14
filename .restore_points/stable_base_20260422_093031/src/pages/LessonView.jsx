// src/pages/curriculum/LessonView.jsx
import React from "react";
import PitchInFuelButton from "@/components/curriculum/PitchInFuelButton.jsx";

export default function LessonView({ lesson }) {
  const title = lesson?.title;
  const slug  = lesson?.slug;

  return (
    <div className="lesson">
      {/* ...your existing lesson UI... */}

      <div className="pad" style={{ marginTop: 12 }}>
        <PitchInFuelButton title={title} slug={slug} />
      </div>
    </div>
  );
}
