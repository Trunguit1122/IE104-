#!/usr/bin/env bash
set -e

# Mặc định lưu trong /models nếu không có biến môi trường
MODEL_DIR=${MODEL_DIR:-/models}
mkdir -p "$MODEL_DIR"

download_and_extract () {
  local name="$1"
  local file_id="$2"
  local target_dir="${MODEL_DIR}/${name}"
  local tmp_tar="/tmp/${name}.tar.gz"

  # Kiểm tra nếu thư mục đã tồn tại và có dữ liệu
  if [ -d "$target_dir" ] && [ "$(ls -A "$target_dir" 2>/dev/null)" ]; then
    echo "✅ Model ${name} already exists at ${target_dir}"
    return
  fi

  echo "⬇️ Downloading ${name} from Google Drive..."
  # Dùng --fuzzy để tránh lỗi quota/permission với file lớn
  gdown --fuzzy --id "$file_id" -O "$tmp_tar"

  echo "📦 Extracting ${name}..."
  mkdir -p "$target_dir"
  # Giải nén vào đích
  tar -xzf "$tmp_tar" -C "$target_dir"
  
  # Dọn dẹp file rác
  rm -f "$tmp_tar"

  echo "✅ Done ${name}"
}

# Thực hiện tải 2 model
download_and_extract "ielts-writing-v3-classification" "${WRITING_MODEL_FILE_ID}"
download_and_extract "speaking-cefr-roberta" "${SPEAKING_MODEL_FILE_ID}"

# Chạy lệnh chính (start app)
exec "$@"

