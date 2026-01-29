/**
 * HOOPERITS CMS - Admin Layout (authenticated pages)
 */

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { getAllContentTypes } from '@hooperits/cms';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contentTypes = await getAllContentTypes();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        contentTypes={contentTypes.map((ct) => ({
          name: ct.name,
          label: ct.label,
          labelPlural: ct.labelPlural,
          icon: ct.icon ?? undefined,
        }))}
      />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
