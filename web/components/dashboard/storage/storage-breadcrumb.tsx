"use client";

import { SquareArrowLeft } from "lucide-react";
import type { BreadcrumbItem } from "@/types/storage";

type Props = {
  currentFolderId: number | null;
  rootLabel: string;
  breadcrumb: BreadcrumbItem[];
  externalCrumb?: {
    label: string;
    currentLabel: string;
    onBack: () => void;
  };
  onGoRoot: () => void;
  onGoBackFolder: () => void;
  onOpenFolder: (folderId: number) => void;
};

export default function StorageBreadcrumb({
  currentFolderId,
  rootLabel,
  breadcrumb,
  externalCrumb,
  onGoRoot,
  onGoBackFolder,
  onOpenFolder,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      {(currentFolderId || externalCrumb) && (
        <>
          <button
            type="button"
            onClick={currentFolderId ? onGoBackFolder : externalCrumb?.onBack}
            className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
          >
            <SquareArrowLeft />
          </button>
          <span className="text-gray-300">|</span>
        </>
      )}

      {externalCrumb ? (
        <>
          <button
            type="button"
            onClick={externalCrumb.onBack}
            className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
          >
            {externalCrumb.label}
          </button>

          <span>/</span>

          <span className="rounded-md px-2 py-1 font-medium text-gray-800">
            {externalCrumb.currentLabel}
          </span>

          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;

            return (
              <div key={item.id} className="flex items-center gap-2">
                <span>/</span>
                {isLast ? (
                  <span className="rounded-md px-2 py-1 font-medium text-gray-800">
                    {item.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenFolder(item.id)}
                    className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
                  >
                    {item.name}
                  </button>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <>
          <button
            onClick={onGoRoot}
            className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
          >
            {rootLabel}
          </button>

          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;

            return (
              <div key={item.id} className="flex items-center gap-2">
                <span>/</span>
                {isLast ? (
                  <span className="rounded-md px-2 py-1 font-medium text-gray-800">
                    {item.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenFolder(item.id)}
                    className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
                  >
                    {item.name}
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
