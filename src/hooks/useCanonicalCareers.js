import { useCallback, useEffect, useState } from "react";
import { getCareer, getCareerCurriculum, listCareers } from "@/lib/career/api.js";
import { careerToPathway } from "@/shared/career/careerAdapter.js";

export default function useCanonicalCareers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listCareers()
      .then((careers) => { if (alive) { setData(careers.map((career) => careerToPathway(career))); setError(null); } })
      .catch((nextError) => { if (alive) { setData([]); setError(nextError); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const loadCareer = useCallback(async (slug) => {
    const career = await getCareer(slug);
    const detail = await getCareerCurriculum(slug);
    return careerToPathway(career, detail?.requirements || []);
  }, []);

  return { data, loading, error, loadCareer };
}
