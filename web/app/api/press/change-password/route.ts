import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { code, email, current_password, new_password } = await request.json();

    if (!code || !email || !current_password || !new_password) {
      return NextResponse.json(
        { error: "Code, email, current password, and new password required" },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the publisher by code and email
    const { data: publisher, error: findError } = await supabaseAdmin
      .from("press")
      .select("id, password, verified")
      .eq("code", code.toUpperCase())
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (findError || !publisher) {
      return NextResponse.json(
        { error: "Invalid code or email" },
        { status: 401 }
      );
    }

    if (!publisher.verified) {
      return NextResponse.json(
        { error: "Publisher account not verified yet" },
        { status: 403 }
      );
    }

    // Verify current password
    if (publisher.password !== current_password) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from("press")
      .update({ password: new_password })
      .eq("id", publisher.id);

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Password change failed" },
      { status: 500 }
    );
  }
}
