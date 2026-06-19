export function getModuleLoadingCopy(pathname: string) {
  if (pathname === "/dashboard") {
    return {
      title: "Dashboard",
      subtitle: "Preparing business overview...",
    };
  }

  if (pathname === "/members") {
    return {
      title: "Members",
      subtitle: "Preparing member records...",
    };
  }

  if (pathname.startsWith("/members/new")) {
    return {
      title: "Add Member",
      subtitle: "Preparing member setup...",
    };
  }

  if (pathname.startsWith("/members/")) {
    return {
      title: "Member Details",
      subtitle: "Preparing member workspace...",
    };
  }

  if (pathname === "/plans") {
    return {
      title: "Plans",
      subtitle: "Preparing membership plans...",
    };
  }

  if (pathname === "/slots") {
    return {
      title: "Slots",
      subtitle: "Preparing slot schedule...",
    };
  }

  if (pathname === "/pricing") {
    return {
      title: "Pricing Rules",
      subtitle: "Preparing pricing logic...",
    };
  }

  if (pathname === "/users") {
    return {
      title: "Users",
      subtitle: "Preparing user access...",
    };
  }

  if (pathname === "/settings") {
    return {
      title: "Settings",
      subtitle: "Preparing business settings...",
    };
  }

  if (pathname === "/audit-trail") {
    return {
      title: "Audit Trail",
      subtitle: "Preparing business activity...",
    };
  }

  if (pathname === "/login") {
    return {
      title: "Membership Tracker",
      subtitle: "Preparing access...",
    };
  }

  return {
    title: "Membership Tracker",
    subtitle: "Preparing workspace...",
  };
}
