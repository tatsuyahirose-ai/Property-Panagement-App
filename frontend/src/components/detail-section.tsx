"use client";

interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailSectionProps {
  title: string;
  fields: DetailField[];
}

export default function DetailSection({ title, fields }: DetailSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{field.value ?? "-"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
