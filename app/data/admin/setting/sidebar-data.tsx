import { MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faLocationDot,
  faFileContract,
  faClipboardCheck,
  faUserGroup,
  faCalendarCheck,
  faTable,
  faClipboardList,
  faCircleQuestion,
  faBookOpen,
  faFileLines,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/label";

type MenuItems = NonNullable<MenuProps["items"]>;

export type AdminRole = "ADMIN" | "SUPER_ADMIN" | "CANDIDATE";

const restrictedRoutes: Record<string, AdminRole[]> = {
  "/admin/dashboard/user-management": ["SUPER_ADMIN"],
  "/admin/dashboard/template": ["SUPER_ADMIN"],
  "/admin/dashboard/evaluation": ["SUPER_ADMIN"],
  "/admin/dashboard/evaluator": ["SUPER_ADMIN"],
  "/admin/dashboard/assignment-setting": ["SUPER_ADMIN"],
  "/admin/dashboard/procedure-document": ["SUPER_ADMIN"],
};

const filterMenuItems = (
  items: MenuProps["items"],
  role?: AdminRole
): MenuProps["items"] => {
  if (!role || role === "SUPER_ADMIN") return items;

  return (
    items
      ?.map((item) => {
        if (!item) return null;

        const key = typeof item.key === "string" ? item.key : undefined;
        if (key) {
          const allowedRoles = restrictedRoutes[key];
          if (allowedRoles && !allowedRoles.includes(role)) {
            return null;
          }
        }

        if ("children" in item && item.children && item.children.length > 0) {
          const filteredChildren = filterMenuItems(
            item.children as MenuProps["items"],
            role
          );

          if (!filteredChildren?.length) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item): item is MenuItems[number] => !!item) ?? []
  );
};

export const SidebarMenuSettingAdmin = (
  role?: AdminRole
): MenuProps["items"] => {
  const router = useRouter();

  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/admin/dashboard/user-management",
      label: menuLabel("User Management"),
      icon: <FontAwesomeIcon icon={faUserGroup} />,
      onClick: () => router.push("/admin/dashboard/user-management"),
    },
    // {
    //   key: "/admin/dashboard/merchant-recruitment/setting-job",
    //   label: menuLabel("Setting Job"),
    //   icon: <FontAwesomeIcon icon={faBriefcase} />,
    //   onClick: () =>
    //     router.push("/admin/dashboard/merchant-recruitment/setting-job"),
    // },
    // {
    //   key: "/admin/dashboard/merchant-recruitment/company-setting",
    //   label: menuLabel("Company Setting"),
    //   icon: <FontAwesomeIcon icon={faGear} />,
    //   children: [
    //     {
    //       key: "/admin/dashboard/merchant-recruitment/company-setting/profile",
    //       label: menuLabel("Company Profile"),
    //       icon: <FontAwesomeIcon icon={faBriefcase} />,
    //       onClick: () =>
    //         router.push(
    //           "/admin/dashboard/merchant-recruitment/company-setting/profile"
    //         ),
    //     },
    //     {
    //       key: "/admin/dashboard/merchant-recruitment/company-setting/location",
    //       label: menuLabel("Location"),
    //       icon: <FontAwesomeIcon icon={faLocationDot} />,
    //       onClick: () =>
    //         router.push(
    //           "/admin/dashboard/merchant-recruitment/company-setting/location"
    //         ),
    //     },
    //   ],
    // },
  ];

  return filterMenuItems(sidebarMenu, role);
};
