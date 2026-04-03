"use client";

import { List, Avatar, Space, Tag, Dropdown, Button, Image } from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined, DragOutlined, MessageOutlined } from "@ant-design/icons";
import { CSSProperties, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DND_ITEM, DragItem } from "./types";
import getInitials from "./initials-username";
import { useRouter } from "next/navigation";
import { openWhatsAppTemplate } from "./whatsaap";
import { ApplicantDataModel } from "../models/applicant";

type Props = {
  id: string;
  applicant: ApplicantDataModel;
  onClick: () => void;
  visibleIndex: number;
  onHoverMove: (dragId: string, overId: string) => void;
  isSelected?: boolean;
};

export default function DraggableCandidateItem({
  id,
  applicant,
  onClick,
  visibleIndex,
  onHoverMove,
  isSelected = false,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const [{ isDragging }, drag] = useDrag({
    type: DND_ITEM.CANDIDATE,
    item: (): DragItem => ({ type: DND_ITEM.CANDIDATE, id, visibleIndex }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop<DragItem>({
    accept: DND_ITEM.CANDIDATE,
    hover: (dragItem, monitor) => {
      if (!ref.current) return;
      const dragId = dragItem.id;
      const overId = id;
      if (dragId === overId) return;

      // gunakan posisi pointer untuk hanya trigger move saat melewati setengah elemen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Seret ke bawah: hanya saat melewati paruh bawah
      if (dragItem.visibleIndex < visibleIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Seret ke atas: hanya saat melewati paruh atas
      if (dragItem.visibleIndex > visibleIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onHoverMove(dragId, overId);
      // update index agar animasi/hover berikutnya akurat
      dragItem.visibleIndex = visibleIndex;
    },
  });

  drag(drop(ref));

  const style: CSSProperties = {
    border: "1px solid",
    borderColor: isSelected ? "#2370ff" : "#f0f0f0",
    background: isSelected ? "#f5f9ff" : "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    cursor: "grab",
    transition: "0.2s",
    opacity: isDragging ? 0.6 : 1,
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "chat",
      label: "Chat",
      icon: <MessageOutlined />,
    },
    {
      key: "chatViaWhatsaap",
      label: "Chat via Whatsapp",
      icon: <MessageOutlined />,
    },
  ];

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    switch (key) {
      case "chat":
        return;
        break;

      case "chatViaWhatsaap": {
        openWhatsAppTemplate({
          to: applicant?.user?.phone ?? "",
          name: applicant?.user?.name ?? "",
          position: applicant?.job?.job_title ?? "",
          message: `Hello ${applicant?.user?.name ?? "Candidate"},\n\nI am from the Nur Cahaya Tunggal Recruitment team. I would like to discuss your application further for the ${applicant?.job?.job_title ?? "-"} position. Please reply to this message if you have any questions.\n\nThank you!`,
        });
        break;
      }

      default:
        break;
    }
  };
  return (
    <div ref={ref} style={style}>
      <List.Item
        onClick={onClick}
        actions={[
          <Dropdown
            key="more"
            menu={{ items: menuItems, onClick: onMenuClick }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>,
          // drag handle visual
          <DragOutlined
            key="drag"
            style={{ fontSize: 18, color: "#bfbfbf" }}
          />,
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar
              size={40}
              style={{ background: "#e6f0ff", color: "#2458e6" }}
            >
              {applicant.user?.photo_url ? (
                <Image src={applicant.user?.photo_url} alt="avatar" />
              ) : (
                getInitials(applicant.user?.name ?? "")
              )}
            </Avatar>
          }
          title={<span style={{ fontWeight: 600 }}>{applicant.user?.name}</span>}
          description={
            <Space size={8} wrap>
              <Tag>{status}</Tag>
              <span style={{ color: "#999", fontSize: 12 }}>{applicant.user?.email}</span>
            </Space>
          }
        />
      </List.Item>
    </div>
  );
}
