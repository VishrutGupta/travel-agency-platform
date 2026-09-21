export interface FieldChange {
  label: string;
  oldValue: string;
  newValue: string;
  type: "changed" | "added" | "removed";
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  destination: "Destination",
  region: "Region",
  start_date: "Start Date",
  end_date: "End Date",
  duration: "Duration",
  nights: "Nights",
  price: "Price",
  original_price: "Original Price",
  short_description: "Short Description",
  description: "Description",
  cover_image_url: "Cover Photo",
  gallery_urls: "Gallery",
  brochure_url: "Brochure",
  trip_type: "Trip Type",
  experience: "Experience",
  difficulty: "Difficulty",
  family_friendly: "Family Friendly",
  featured: "Featured",
  is_active: "Active",
  highlights: "Highlights",
  inclusions: "Inclusions",
  exclusions: "Exclusions",
  itinerary: "Itinerary",
  important_info: "Important Info",
  max_group_size: "Max Group Size",
  whatsapp_number: "WhatsApp Number",
  agency_id: "Agency",
  name: "Agency Name",
  tagline: "Tagline",
  logo: "Logo",
  phone: "Phone",
  whatsapp: "WhatsApp",
  email: "Email",
  address: "Address",
  instagram: "Instagram",
  facebook: "Facebook",
  website: "Website",
  accent_color: "Accent Color",
  username: "Username",
  role: "Role",
  is_disabled: "Status",
  permissions: "Permissions",
  actor_user_id: "Actor User ID",
  actor_username: "Actor Username",
  metadata: "Metadata",
  before_data: "Before",
  after_data: "After",
  created_at: "Created At",
  updated_at: "Updated At",
  id: "ID",
};

const SKIP_FIELDS = new Set(["id", "agency_id", "created_at", "updated_at", "actor_user_id", "actor_username"]);

const PRICE_FIELDS = new Set(["price", "original_price"]);

const DATE_FIELDS = new Set(["start_date", "end_date", "created_at", "updated_at"]);

const BOOLEAN_FIELDS = new Set(["family_friendly", "featured", "is_active"]);

const ARRAY_FIELDS = new Set(["highlights", "inclusions", "exclusions", "important_info"]);

const ITINERARY_FIELDS = new Set(["itinerary"]);

const URL_FIELDS = new Set(["cover_image_url", "brochure_url", "gallery_urls"]);

function extractFilename(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";
    if (last && last.includes(".")) return decodeURIComponent(last);
  } catch {}
  const parts = url.split("?")[0].split("/");
  const last = parts[parts.length - 1] || "";
  if (last && last.includes(".")) return decodeURIComponent(last);
  return "";
}

function describeUrlChange(oldVal: string, newVal: string): { oldLabel: string; newLabel: string } {
  const oldFile = extractFilename(oldVal);
  const newFile = extractFilename(newVal);
  return {
    oldLabel: oldFile || "Previous file",
    newLabel: newFile || "New file",
  };
}

export function getLabel(key: string): string {
  return FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (PRICE_FIELDS.has(key)) return `\u20B9${Number(value).toLocaleString("en-IN")}`;
  if (DATE_FIELDS.has(key)) {
    try {
      const d = new Date(String(value));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
      }
    } catch {}
  }
  if (key === "gallery_urls" && Array.isArray(value)) {
    return value.length > 0 ? `${value.length} image${value.length !== 1 ? "s" : ""}` : "\u2014";
  }
  if (ARRAY_FIELDS.has(key) && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "\u2014";
  }
  if (ITINERARY_FIELDS.has(key) && Array.isArray(value)) {
    if (value.length === 0) return "\u2014";
    return value.map((item: any) => {
      if (typeof item === "object" && item !== null) {
        return `Day ${item.day || "?"}: ${item.title || "Untitled"}`;
      }
      return String(item);
    }).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function computeChanges(
  beforeData: Record<string, unknown> | null | undefined,
  afterData: Record<string, unknown> | null | undefined
): FieldChange[] {
  if (!beforeData && !afterData) return [];

  const before = beforeData || {};
  const after = afterData || {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: FieldChange[] = [];

  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;
    const bVal = before[key];
    const aVal = after[key];
    const bStr = JSON.stringify(bVal);
    const aStr = JSON.stringify(aVal);

    if (bStr === aStr) continue;

    const label = getLabel(key);

    if (key === "cover_image_url" || key === "brochure_url") {
      const bIsEmpty = !bVal || bVal === null || bVal === undefined || bVal === "";
      const aIsEmpty = !aVal || aVal === null || aVal === undefined || aVal === "";

      if (bIsEmpty && !aIsEmpty) {
        const filename = extractFilename(String(aVal));
        changes.push({ label, oldValue: "", newValue: filename || "Added", type: "added" });
      } else if (!bIsEmpty && aIsEmpty) {
        const filename = extractFilename(String(bVal));
        changes.push({ label, oldValue: filename || "Removed", newValue: "", type: "removed" });
      } else if (!bIsEmpty && !aIsEmpty) {
        const { oldLabel, newLabel } = describeUrlChange(String(bVal), String(aVal));
        if (oldLabel !== newLabel) {
          changes.push({ label, oldValue: oldLabel, newValue: newLabel, type: "changed" });
        }
      }
      continue;
    }

    if (key === "gallery_urls") {
      const bArr = Array.isArray(bVal) ? bVal : [];
      const aArr = Array.isArray(aVal) ? aVal : [];
      const bSet = new Set(bArr.map(String));
      const aSet = new Set(aArr.map(String));
      const added = aArr.filter((v) => !bSet.has(String(v)));
      const removed = bArr.filter((v) => !aSet.has(String(v)));

      if (added.length === 0 && removed.length === 0) continue;

      const parts: string[] = [];
      if (added.length > 0) parts.push(`${added.length} image${added.length !== 1 ? "s" : ""} added`);
      if (removed.length > 0) parts.push(`${removed.length} image${removed.length !== 1 ? "s" : ""} removed`);
      changes.push({ label, oldValue: removed.length > 0 ? `${removed.length} removed` : "", newValue: added.length > 0 ? `${added.length} added` : "", type: added.length > 0 && removed.length > 0 ? "changed" : added.length > 0 ? "added" : "removed" });
      continue;
    }

    if (bVal === undefined || bVal === null) {
      if (aVal !== undefined && aVal !== null) {
        changes.push({ label, oldValue: "", newValue: formatValue(key, aVal), type: "added" });
      }
    } else if (aVal === undefined || aVal === null) {
      changes.push({ label, oldValue: formatValue(key, bVal), newValue: "", type: "removed" });
    } else {
      changes.push({ label, oldValue: formatValue(key, bVal), newValue: formatValue(key, aVal), type: "changed" });
    }
  }

  return changes;
}

export function getResourceTitle(log: { description?: string; resourceType?: string; beforeData?: Record<string, unknown> | null; afterData?: Record<string, unknown> | null }): string {
  const data = log.afterData || log.beforeData;
  if (!data) return "";

  if (data.title) return String(data.title);
  if (data.name) return String(data.name);
  if (data.destination) return String(data.destination);
  if (data.username) return String(data.username);

  return "";
}

export function getImportantFields(data: Record<string, unknown> | null | undefined, resourceType: string): { label: string; value: string }[] {
  if (!data) return [];

  if (resourceType === "Trip") {
    return [
      data.destination && { label: "Destination", value: formatValue("destination", data.destination) },
      data.price && { label: "Price", value: formatValue("price", data.price) },
      data.duration && data.nights && { label: "Duration", value: `${data.nights} nights / ${data.duration} days` },
      data.duration && !data.nights && { label: "Duration", value: `${data.duration} days` },
      !data.duration && data.nights && { label: "Duration", value: `${data.nights} nights` },
      data.trip_type && { label: "Trip Type", value: formatValue("trip_type", data.trip_type) },
      data.experience && { label: "Experience", value: formatValue("experience", data.experience) },
      data.difficulty && { label: "Difficulty", value: formatValue("difficulty", data.difficulty) },
    ].filter(Boolean) as { label: string; value: string }[];
  }

  if (resourceType === "User") {
    return [
      data.name && { label: "Name", value: formatValue("name", data.name) },
      data.username && { label: "Username", value: formatValue("username", data.username) },
      data.role && { label: "Role", value: formatValue("role", data.role) },
    ].filter(Boolean) as { label: string; value: string }[];
  }

  if (resourceType === "Settings") {
    return Object.entries(data)
      .filter(([k]) => !SKIP_FIELDS.has(k))
      .slice(0, 10)
      .map(([k, v]) => ({ label: getLabel(k), value: formatValue(k, v) }));
  }

  return Object.entries(data)
    .filter(([k]) => !SKIP_FIELDS.has(k))
    .slice(0, 8)
    .map(([k, v]) => ({ label: getLabel(k), value: formatValue(k, v) }));
}

export function getActionTitle(action: string, resourceType: string, title?: string): string {
  const resource = resourceType === "Auth" ? "Login" : resourceType;
  switch (action) {
    case "trip.create": return `Trip Added`;
    case "trip.update": return `Trip Updated`;
    case "trip.delete": return `Trip Deleted`;
    case "settings.update": return `Settings Updated`;
    case "user.create": return `User Added`;
    case "user.update": return `User Updated`;
    case "user.delete": return `User Deleted`;
    case "login": return `Login Successful`;
    case "logout": return `Logout`;
    case "denied": return `Access Denied`;
    default: return `${resource} ${action.charAt(0).toUpperCase() + action.slice(1)}`;
  }
}
