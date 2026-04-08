"use client";

import { createContext, useContext } from "react";

type AdminRoleContextValue = {
  role?: string;
};

const AdminRoleContext = createContext<AdminRoleContextValue>({ role: undefined });

export const AdminRoleProvider = ({
  role,
  children,
}: {
  role?: string;
  children: React.ReactNode;
}) => {
  return (
    <AdminRoleContext.Provider value={{ role }}>
      {children}
    </AdminRoleContext.Provider>
  );
};

export const useAdminRole = () => useContext(AdminRoleContext);
