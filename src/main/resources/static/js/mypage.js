document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // 배경 클릭하면 닫기(원하면 삭제)
    const backdrop = document.getElementById("review-modal-backdrop");
    if (backdrop) {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeModal();
        });
    }

    loadMyBooks();
});

// 1) 카드로 책 목록 표시
async function loadMyBooks() {
    const container = document.getElementById("my-books");
    container.innerHTML = "";

    const res = await fetch("/api/me/books");
    if (!res.ok) {
        container.innerHTML = "<li>책 목록을 불러오지 못했습니다.</li>";
        return;
    }
    const books = await res.json(); // [{ isbn13: "..." }, ...]

    if (books.length === 0) {
        container.innerHTML = "<li>리뷰를 남긴 책이 아직 없습니다.</li>";
        return;
    }

    for (const b of books) {
        const li = document.createElement("li");
        li.className = "book-card";

        try {
            // 책 상세 정보 가져오기 (제목/표지)
            const detailRes = await fetch(`/api/books/${b.isbn13}`);
            if (!detailRes.ok) continue;
            const book = await detailRes.json(); // BookView

            const img = document.createElement("img");
            img.className = "book-cover";
            img.src = book.coverUrl || "";
            img.alt = book.title || "";

            const titleDiv = document.createElement("div");
            titleDiv.className = "book-title";
            titleDiv.textContent = book.title || b.isbn13;

            li.appendChild(img);
            li.appendChild(titleDiv);

            li.addEventListener("click", () =>
                openBookModal(b.isbn13, book.title || b.isbn13)
            );

            container.appendChild(li);
        } catch (e) {
            console.error("책 상세 조회 실패", e);
        }
    }
}

// 2) 모달 열기: 해당 책에 대해 내가 쓴 리뷰 + 코멘트
async function openBookModal(isbn13, title) {
    const backdrop = document.getElementById("review-modal-backdrop");
    const titleEl = document.getElementById("modal-book-title");
    const linkEl = document.getElementById("modal-book-link");
    const reviewEl = document.getElementById("modal-reviews");
    const commentEl = document.getElementById("modal-comments");

    titleEl.textContent = title;
    linkEl.innerHTML = `<a href="/books/${isbn13}">도서 상세 페이지로 이동</a>`;

    reviewEl.textContent = "리뷰를 불러오는 중...";
    commentEl.textContent = "코멘트를 불러오는 중...";

    const [reviewRes, commentRes] = await Promise.all([
        fetch(`/api/me/books/${isbn13}/reviews`),
        fetch(`/api/me/books/${isbn13}/page-comments`),
    ]);

    // --- 리뷰 표시 ---
    if (!reviewRes.ok) {
        reviewEl.textContent = "리뷰를 불러오지 못했습니다.";
    } else {
        const reviews = await reviewRes.json();
        if (reviews.length === 0) {
            reviewEl.textContent = "이 책에 남긴 리뷰가 없습니다.";
        } else {
            reviewEl.innerHTML = "";
            for (const r of reviews) {
                const div = document.createElement("div");
                div.className = "modal-review-item";

                const meta = document.createElement("div");
                meta.className = "modal-review-meta";
                meta.textContent = `평점: ${r.rating ?? "-"} | 스포일러: ${
                    r.spoiler ? "O" : "X"
                } | 작성일: ${r.createdAt ?? ""}`;

                const body = document.createElement("div");
                body.textContent = r.overall;

                div.appendChild(meta);
                div.appendChild(body);
                reviewEl.appendChild(div);
            }
        }
    }

    // --- 코멘트 표시 ---
    if (!commentRes.ok) {
        commentEl.textContent = "코멘트를 불러오지 못했습니다.";
    } else {
        const comments = await commentRes.json(); // MyPageCommentResponse[]
        if (comments.length === 0) {
            commentEl.textContent = "이 책에 남긴 코멘트가 없습니다.";
        } else {
            commentEl.innerHTML = "";
            for (const c of comments) {
                const div = document.createElement("div");
                div.className = "modal-review-item";

                const meta = document.createElement("div");
                meta.className = "modal-review-meta";
                meta.textContent = `p.${c.page} | 작성일: ${c.createdAt ?? ""}`;

                const body = document.createElement("div");
                body.textContent = c.comment;

                div.appendChild(meta);
                div.appendChild(body);
                commentEl.appendChild(div);
            }
        }
    }

    backdrop.classList.add("show");
}

function closeModal() {
    document.getElementById("review-modal-backdrop")?.classList.remove("show");
}
