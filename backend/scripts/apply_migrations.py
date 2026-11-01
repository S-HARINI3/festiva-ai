"""
Festiva AI — Database Migration Runner
Applies DDL migrations and Row Level Security (RLS) policies to PostgreSQL / Supabase.
"""
import os
import sys
from pathlib import Path

MIGRATION_FILE = Path(__file__).resolve().parent.parent / "migrations" / "001_initial_schema.sql"


def main():
    print("=" * 70)
    print("🎉 FESTIVA AI — DATABASE MIGRATION RUNNER")
    print("=" * 70)

    if not MIGRATION_FILE.exists():
        print(f"❌ Error: Migration file not found at: {MIGRATION_FILE}")
        sys.exit(1)

    with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"✓ Found migration script: {MIGRATION_FILE.name}")
    print(f"✓ Migration size: {len(sql_content):,} bytes across 10 tables and RLS policies.")

    database_url = os.getenv("DATABASE_URL")
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if database_url:
        print(f"\nAttempting direct connection to DATABASE_URL...")
        try:
            import psycopg2
            conn = psycopg2.connect(database_url)
            cur = conn.cursor()
            cur.execute(sql_content)
            conn.commit()
            cur.close()
            conn.close()
            print("✅ All migrations and RLS policies applied successfully!")
            return
        except ImportError:
            print("ℹ️ psycopg2 not installed. Run `pip install psycopg2-binary` to apply directly from CLI.")
        except Exception as e:
            print(f"⚠️ Error executing via psycopg2: {e}")

    print("\n" + "=" * 70)
    print("📋 SUPABASE DASHBOARD MIGRATION INSTRUCTIONS (RECOMMENDED)")
    print("=" * 70)
    print("To apply this migration in 30 seconds:")
    print("1. Log into your Supabase Dashboard: https://supabase.com/dashboard")
    print("2. Open your project -> Click on 'SQL Editor' in the left navigation.")
    print("3. Click '+ New Query'.")
    print(f"4. Copy and paste the contents of: {MIGRATION_FILE}")
    print("5. Click 'Run' (or press Ctrl+Enter / Cmd+Enter).")
    print("\n✓ This will create the following 10 tables with automatic triggers & strict RLS:")
    print("   1. profiles               6. tasks")
    print("   2. events                 7. vendors")
    print("   3. event_plans            8. guests")
    print("   4. budget_categories      9. moodboards")
    print("   5. expenses              10. copilot_conversations")
    print("=" * 70)


if __name__ == "__main__":
    main()

