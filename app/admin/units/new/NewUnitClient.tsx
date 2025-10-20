// app/admin/units/new/NewUnitClient.tsx
"use client";

import { useMemo, useState } from "react";
import NewUnitForm from "./NewUnitForm";

type CourseOption = {
  id: string;
  title: string;
  slug: string;
  modules: { id: string; title: string; slug: string; sortIndex: number }[];
};

export default function NewUnitClient({ initialData }: { initialData: CourseOption[] }) {
  const [courses] = useState<CourseOption[]>(initialData);

  const flatModules = useMemo(
    () =>
      courses.flatMap((c) =>
        c.modules.map((m) => ({ ...m, course: { id: c.id, title: c.title, slug: c.slug } }))
      ),
    [courses]
  );

  return (
    <div className="mt-6">
      <NewUnitForm courses={courses} modulesFlat={flatModules} />
    </div>
  );
}
