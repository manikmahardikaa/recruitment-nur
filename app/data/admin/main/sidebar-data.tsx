import { MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/label";

export const SidebarMenuMainAdmin = (): MenuProps["items"] => {
  const router = useRouter();

  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/admin/dashboard/home",
      label: menuLabel("Dashboard"),
      icon: <FontAwesomeIcon icon={faHome} />,
      onClick: () => router.push("/admin/dashboard/home"),
    },
    {
      key: "/admin/dashboard/merchant-recruitment",
      label: menuLabel("Merchant Recruitment"),
      icon: <FontAwesomeIcon icon={faUserTie} />,
      onClick: () => router.push("/admin/dashboard/merchant-recruitment"),
    },
    // {
    //   key: "/admin/dashboard/history-contract",
    //   label: menuLabel("History Contract"),
    //   icon: <FontAwesomeIcon icon={faChartLine} />,
    //   onClick: () => router.push("/admin/dashboard/history-contract"),
    // },
    // {
    //   key: "/admin/dashboard/schedule-interview",
    //   label: menuLabel("Schedule Interview"),
    //   icon: <FontAwesomeIcon icon={faCalendarCheck} />,
    //   onClick: () => router.push("/admin/dashboard/schedule-interview"),
    // },
    // {
    //   key: "/admin/dashboard/chat",
    //   label: menuLabel("Chat"),
    //   icon: <FontAwesomeIcon icon={faMessage} />,
    //   onClick: () => router.push("/admin/dashboard/chat"),
    // },
  ];

  return sidebarMenu;
};
