
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY




supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)


def upload_file_to_supabase(
    file_path: str,
    file_data: bytes,
    content_type: str | None
):
    result = (
        supabase.storage
        .from_("loanservice")
        .upload(
            file_path,
            file_data,
            {
                "content-type": content_type or "application/octet-stream"
            }
        )
    )


    url = supabase.storage \
        .from_("loanservice") \
        .get_public_url(file_path)
    return result,url