import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryRepo } from "@/features/library/repo";
import { logActivityEvent, getCurrentGroupId } from "@/lib/activity-log";
import {
  ok,
  badRequest,
  unauthenticated,
  notFound,
  conflict,
  internal,
  getLibraryEntryQuerySchema,
  createLibraryEntryBodySchema,
  updateLibraryEntryBodySchema,
  uuidSchema,
  validateQuery,
  validateBody,
  formatZodErrors,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  const { searchParams } = new URL(request.url);
  const parsed = validateQuery(getLibraryEntryQuerySchema, searchParams);

  if (!parsed.success) {
    return badRequest("Invalid query parameters", formatZodErrors(parsed.error));
  }

  const { type, provider, externalId } = parsed.data;

  try {
    // Use user-scoped method to find MY entry
    const entry = await libraryRepo.findMyEntryByItem(type, provider, externalId);

    if (!entry) {
      return notFound("Library entry not found");
    }

    return ok(entry);
  } catch (error) {
    console.error("GET /api/library/entry error:", error);
    return internal();
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  try {
    const body = await request.json();
    const parsed = validateBody(createLibraryEntryBodySchema, body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    const dto = parsed.data;

    // Check if MY entry already exists (user-scoped)
    const existing = await libraryRepo.findMyEntryByItem(
      dto.type,
      dto.provider,
      dto.external_id,
      dto.group_id
    );

    if (existing) {
      return conflict("Entry already exists", { entry: existing });
    }

    // Create entry (group_id will be resolved from user's default if not provided)
    const entry = await libraryRepo.create(dto);

    // Log activity event
    await logActivityEvent({
      groupId: entry.group_id,
      actorId: user.id,
      eventType: "library_entry_added",
      entityType: "library_entry",
      entityId: entry.id,
      metadata: {
        item_title: entry.title ?? dto.external_id,
        item_type: dto.type,
      },
    });

    return ok(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/library/entry error:", error);
    return internal();
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body as { id?: string;[key: string]: unknown };

    // Validate id
    if (!id) {
      return badRequest("Missing required field: id");
    }
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return badRequest("Invalid id format");
    }

    // Validate update body
    const parsed = validateBody(updateLibraryEntryBodySchema, updateData);
    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodErrors(parsed.error));
    }

    const entry = await libraryRepo.update(id, parsed.data);

    // Log activity event if status changed
    if (parsed.data.status) {
      await logActivityEvent({
        groupId: entry.group_id,
        actorId: user.id,
        eventType: "library_entry_updated",
        entityType: "library_entry",
        entityId: entry.id,
        metadata: {
          item_title: entry.title ?? undefined,
          new_status: parsed.data.status,
        },
      });
    }

    return ok(entry);
  } catch (error) {
    console.error("PATCH /api/library/entry error:", error);
    return internal();
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthenticated();
  }

  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return badRequest("Missing required field: id");
    }
    const idResult = uuidSchema.safeParse(id);
    if (!idResult.success) {
      return badRequest("Invalid id format");
    }

    // Get entry first for logging
    const groupId = await getCurrentGroupId();

    await libraryRepo.delete(id);

    // Log activity event
    if (groupId) {
      await logActivityEvent({
        groupId,
        actorId: user.id,
        eventType: "library_entry_deleted",
        entityType: "library_entry",
        entityId: id,
        metadata: {},
      });
    }

    return ok({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/library/entry error:", error);
    return internal();
  }
}
