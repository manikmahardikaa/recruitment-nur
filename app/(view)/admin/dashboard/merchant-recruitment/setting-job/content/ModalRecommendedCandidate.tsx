"use client";

import {
  useRecommendedCandidates,
  type RankedCandidateModel,
} from "@/app/hooks/recommended-candidate";
import {
  Button,
  Empty,
  List,
  Modal,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const { Text } = Typography;
const MATCHED_TAG_LIMIT = 6;

type Props = {
  open: boolean;
  jobId?: string;
  jobName?: string;
  onClose: () => void;
};

export default function ModalRecommendedCandidate({
  open,
  jobId,
  jobName,
  onClose,
}: Props) {
  const {
    data: candidates,
    isLoading,
    isFetching,
    refetch,
  } = useRecommendedCandidates({
    jobId,
    enabled: open && Boolean(jobId),
  });

  const router = useRouter();
  const candidateList = (candidates ?? []) as RankedCandidateModel[];
  const showEmpty =
    !isLoading && !isFetching && candidateList.length === 0;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleNavigate = useCallback(
    (candidateId: string) => {
      router.push(
        `/admin/dashboard/merchant-recruitment/setting-job/detail-candidate/${candidateId}`
      );
    },
    [router]
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Recommended Candidates${jobName ? ` • ${jobName}` : ""}`}
      footer={null}
      width={720}
      destroyOnClose
    >
      {!jobId ? (
        <Empty description="Select a job to see recommendations" />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Text type="secondary">
              Candidates are ranked based on interest/skill matches.
            </Text>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isFetching}
            >
              Refresh
            </Button>
          </Space>

          {isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : showEmpty ? (
            <Empty description="No candidates matched yet" />
          ) : (
            <CandidateList
              candidates={candidateList}
              onNavigate={handleNavigate}
            />
          )}
        </Space>
      )}
    </Modal>
  );
}

type CandidateListProps = {
  candidates: RankedCandidateModel[];
  onNavigate: (id: string) => void;
};

function CandidateList({ candidates, onNavigate }: CandidateListProps) {
  return (
    <List
      dataSource={candidates}
      itemLayout="horizontal"
      renderItem={(candidate) => (
        <CandidateListItem
          key={candidate.id}
          candidate={candidate}
          onNavigate={onNavigate}
        />
      )}
    />
  );
}

type CandidateListItemProps = {
  candidate: RankedCandidateModel;
  onNavigate: (id: string) => void;
};

function CandidateListItem({ candidate, onNavigate }: CandidateListItemProps) {
  const limitedMatches = candidate.matched?.slice(0, MATCHED_TAG_LIMIT) ?? [];

  return (
    <List.Item
      key={candidate.id}
      actions={[
        <Tag color="blue" key="score">
          Score {candidate.score}
        </Tag>,
      ]}
    >
      <List.Item.Meta
        avatar={<UserOutlined />}
        title={
          <Space size="small">
            <Text
              strong
              style={{ cursor: "pointer" }}
              onClick={() => onNavigate(candidate.id)}
            >
              {candidate.name}
            </Text>
            <Tag>{`Rank ${candidate.rank ?? "-"}`}</Tag>
          </Space>
        }
        description={
          <Space size={[4, 4]} wrap>
            {limitedMatches.length ? (
              limitedMatches.map((match) => (
                <Tag key={`${candidate.id}-${match}`} color="geekblue">
                  {match}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No overlapping keywords</Text>
            )}
          </Space>
        }
      />
    </List.Item>
  );
}
