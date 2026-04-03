"use client";

import React, { useEffect, useState } from "react";
import { Empty } from "antd";
import { useAuth } from "@/app/utils/useAuth";
import { useCandidateByUserId } from "@/app/hooks/applicant";
import Loading from "@/app/components/common/custom-loading";
import CandidateProgress from "./CandidateProgress";
import { useMobile } from "@/app/hooks/use-mobile";

export default function CandidateProgressPage() {
  const { user_id } = useAuth();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  const applicant_id = searchParams?.get("applicant_id");
  const { data: applicants, fetchLoading } = useCandidateByUserId({
    id: user_id,
  });
  const isMobile = useMobile();

  if (fetchLoading) return <Loading />;
  const applicant = applicant_id
    ? applicants?.find((a) => a?.id === applicant_id)
    : applicants?.[0];

  if (!applicant) return <Empty description="No application found" />;

  return (
    <div
      style={{
        padding: isMobile ? "16px" : "24px",
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      <CandidateProgress applicant={applicant} />
    </div>
  );
}
