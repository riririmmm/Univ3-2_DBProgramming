document.addEventListener("click", async (e) => {
    // 1) 케밥(⋯) 버튼
    const kebab = e.target.closest(".kebab");
    if (kebab) {
        closeAllMenus();
        const panel = kebab.parentElement.querySelector(".menu-panel");
        panel.classList.toggle("show");
        e.stopPropagation();
        return;
    }

    // 2) 메뉴 아이템(수정/삭제) 클릭
    const actionBtn = e.target.closest(".menu-item");
    if (!actionBtn) return;

    const action = actionBtn.dataset.action; // edit-review / delete-review / edit-comment / delete-comment
    const id = actionBtn.dataset.id;

    if (!action || !id) return;

    // === 리뷰 ===
    if (action === "delete-review") {
        if (!confirm("리뷰를 삭제하시겠습니까?")) return;

        const res = await fetch(`/api/me/reviews/${id}`, { method: "DELETE" });
        if (!res.ok) return alert("삭제 실패");

        alert("삭제 완료");
        closeAllMenus();
        location.reload();
        return;
    }

    if (action === "edit-review") {
        const newText = prompt("리뷰 내용을 수정하시겠습니까?");
        if (newText == null) return;

        const res = await fetch(`/api/me/reviews/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ overall: newText }),
        });
        if (!res.ok) return alert("수정 실패");

        alert("수정 완료");
        closeAllMenus();
        location.reload();
        return;
    }

    // === 코멘트 ===
    if (action === "delete-comment") {
        if (!confirm("코멘트를 삭제할까요?")) return;

        const res = await fetch(`/api/me/page-comments/${id}`, { method: "DELETE" });
        if (!res.ok) return alert("삭제 실패");

        alert("삭제 완료");
        closeAllMenus();
        location.reload();
        return;
    }

    if (action === "edit-comment") {
        const newText = prompt("코멘트 내용을 수정해줘");
        if (newText == null) return;

        const res = await fetch(`/api/me/page-comments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: newText }),
        });
        if (!res.ok) return alert("수정 실패");

        alert("수정 완료");
        closeAllMenus();
        location.reload();
        return;
    }
});


// 1) 카드로 책 목록 표시
async function loadMyBooks() {
    const container = document.getElementById("my-books");
    container.innerHTML = "";

    // 리뷰 책 목록 + 코멘트 책 목록 동시에 받기
    const [reviewRes, commentRes] = await Promise.all([
        fetch("/api/me/books"),          // 리뷰 기반 책 목록
        fetch("/api/me/page-comments"),  // 코멘트 기반 책 목록
    ]);

    const reviewBooks  = reviewRes.ok  ? await reviewRes.json()  : [];
    const commentBooks = commentRes.ok ? await commentRes.json() : [];

    // isbn13 기준 중복 제거
    const map = new Map();
    [...reviewBooks, ...commentBooks].forEach(b => {
        if (b && b.isbn13) map.set(b.isbn13, { isbn13: b.isbn13 });
    });
    const books = [...map.values()];

    if (books.length === 0) {
        container.innerHTML = "<li>리뷰/코멘트를 남긴 책이 아직 없습니다.</li>";
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

    const [reviewRes, commentRes] = await Promise.all([fetch(`/api/me/books/${isbn13}/reviews`), fetch(`/api/me/books/${isbn13}/page-comments`),]);

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

                // 헤더(메타 + 메뉴)
                const head = document.createElement("div");
                head.className = "item-head";

                const meta = document.createElement("div");
                meta.className = "modal-review-meta";
                meta.textContent = `평점: ${r.rating ?? '-'} | 스포일러: ${r.spoiler ? 'O' : 'X'} | 작성일: ${r.createdAt ?? ''}`;

                const menu = document.createElement("div");
                menu.className = "menu";
                menu.innerHTML = `
                    <button class="kebab" type="button" aria-label="menu">⋯</button>
                    <div class="menu-panel">
                        <button class="menu-item" type="button" data-action="edit-review" data-id="${r.id}">수정하기</button>
                        <button class="menu-item danger" type="button" data-action="delete-review" data-id="${r.id}">삭제하기</button>
                    </div>
                `;

                head.appendChild(meta);
                head.appendChild(menu);

                const body = document.createElement("div");
                body.textContent = r.overall;

                div.appendChild(head);
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

                const head = document.createElement("div");
                head.className = "item-head";

                const meta = document.createElement("div");
                meta.className = "modal-review-meta";
                meta.textContent = `p.${c.page} | 작성일: ${c.createdAt ?? ''}`;

                const menu = document.createElement("div");
                menu.className = "menu";
                menu.innerHTML = `
                    <button class="kebab" type="button" aria-label="menu">⋯</button>
                    <div class="menu-panel">
                      <button class="menu-item" type="button" data-action="edit-comment" data-id="${c.id}">수정하기</button>
                      <button class="menu-item danger" type="button" data-action="delete-comment" data-id="${c.id}">삭제하기</button>
                    </div>
                `;

                head.appendChild(meta);
                head.appendChild(menu);

                const body = document.createElement("div");
                body.textContent = c.comment;

                div.appendChild(head);
                div.appendChild(body);
                commentEl.appendChild(div);
            }
        }
    }

    backdrop.classList.add("show");
}

// 리뷰 영역 이벤트 위임
document.addEventListener("click", async (e) => {
    // 케밥 버튼
    const kebab = e.target.closest(".kebab");
    if (kebab) {
        closeAllMenus();
        const panel = kebab.parentElement.querySelector(".menu-panel");
        panel.classList.toggle("show");
        e.stopPropagation();
        return;
    }

    // 메뉴 아이템 액션
    const actionBtn = e.target.closest(".menu-item");
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;

    if (action === "delete-review") {
        if (!confirm("리뷰를 삭제할까요?")) return;

        // TODO: 너 백엔드에 맞게 URL/메서드 수정
        const res = await fetch(`/api/me/reviews/${id}`, { method: "DELETE" });
        if (!res.ok) return alert("삭제 실패");

        alert("삭제 완료");
        closeAllMenus();
        // 간단히: 모달 다시 열기(현재 책 isbn을 저장해두면 더 깔끔)
        location.reload();
    }

    if (action === "edit-review") {
        // 아주 간단한 방식: prompt로 수정(나중에 폼 모달로 바꾸면 됨)
        const newText = prompt("리뷰 내용을 수정해줘");
        if (newText == null) return;

        const res = await fetch(`/api/me/reviews/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ overall: newText }),
        });
        if (!res.ok) return alert("수정 실패");

        alert("수정 완료");
        closeAllMenus();
        location.reload();
    }
});

function closeModal() {
    document.getElementById("review-modal-backdrop")?.classList.remove("show");
}

function closeAllMenus() {
    document.querySelectorAll(".menu-panel.show")
        .forEach(p => p.classList.remove("show"));
}
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

    // 리뷰 책 목록 + 코멘트 책 목록 동시에 받기
    const [reviewRes, commentRes] = await Promise.all([
        fetch("/api/me/books"),          // 리뷰 기반 책 목록
        fetch("/api/me/page-comments"),  // 코멘트 기반 책 목록
    ]);

    const reviewBooks  = reviewRes.ok  ? await reviewRes.json()  : [];
    const commentBooks = commentRes.ok ? await commentRes.json() : [];

    // isbn13 기준 중복 제거
    const map = new Map();
    [...reviewBooks, ...commentBooks].forEach(b => {
        if (b && b.isbn13) map.set(b.isbn13, { isbn13: b.isbn13 });
    });
    const books = [...map.values()];

    if (books.length === 0) {
        container.innerHTML = "<li>리뷰/코멘트를 남긴 책이 아직 없습니다.</li>";
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

    const [reviewRes, commentRes] = await Promise.all([fetch(`/api/me/books/${isbn13}/reviews`), fetch(`/api/me/books/${isbn13}/page-comments`),]);

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

                // 헤더(메타 + 메뉴)
                const head = document.createElement("div");
                head.className = "item-head";

                const meta = document.createElement("div");
                meta.className = "modal-review-meta";
                meta.textContent = `평점: ${r.rating ?? '-'} | 스포일러: ${r.spoiler ? 'O' : 'X'} | 작성일: ${r.createdAt ?? ''}`;

                const menu = document.createElement("div");
                menu.className = "menu";
                menu.innerHTML = `
                    <button class="kebab" type="button" aria-label="menu">⋯</button>
                    <div class="menu-panel">
                        <button class="menu-item" type="button" data-action="edit-review" data-id="${r.id}">수정하기</button>
                        <button class="menu-item danger" type="button" data-action="delete-review" data-id="${r.id}">삭제하기</button>
                    </div>
                `;

                head.appendChild(meta);
                head.appendChild(menu);

                const body = document.createElement("div");
                body.textContent = r.overall;

                div.appendChild(head);
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

                const head = document.createElement("div");
                head.className = "item-head";

                const meta = document.createElement("div");
                meta.className = "modal-review-meta";
                meta.textContent = `p.${c.page} | 작성일: ${c.createdAt ?? ''}`;

                const menu = document.createElement("div");
                menu.className = "menu";
                menu.innerHTML = `
                    <button class="kebab" type="button" aria-label="menu">⋯</button>
                    <div class="menu-panel">
                      <button class="menu-item" type="button" data-action="edit-comment" data-id="${c.id}">수정하기</button>
                      <button class="menu-item danger" type="button" data-action="delete-comment" data-id="${c.id}">삭제하기</button>
                    </div>
                `;

                head.appendChild(meta);
                head.appendChild(menu);

                const body = document.createElement("div");
                body.textContent = c.comment;

                div.appendChild(head);
                div.appendChild(body);
                commentEl.appendChild(div);
            }
        }
    }

    backdrop.classList.add("show");
}

// 리뷰 영역 이벤트 위임
document.addEventListener("click", async (e) => {
    // 케밥 버튼
    const kebab = e.target.closest(".kebab");
    if (kebab) {
        closeAllMenus();
        const panel = kebab.parentElement.querySelector(".menu-panel");
        panel.classList.toggle("show");
        e.stopPropagation();
        return;
    }

    if (action === "delete-comment") {
        if (!confirm("코멘트를 삭제할까요?")) return;

        const res = await fetch(`/api/me/page-comments/${id}`, { method: "DELETE" });
        if (!res.ok) return alert("삭제 실패");

        alert("삭제 완료");
        closeAllMenus();
        location.reload();
    }

    if (action === "edit-comment") {
        const newText = prompt("코멘트 내용을 수정하시겠습니까?");
        if (newText == null) return;

        const res = await fetch(`/api/me/page-comments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: newText }),
        });
        if (!res.ok) return alert("수정 실패");

        alert("수정 완료");
        closeAllMenus();
        location.reload();
    }

});

function closeModal() {
    document.getElementById("review-modal-backdrop")?.classList.remove("show");
}

function closeAllMenus() {
    document.querySelectorAll(".menu-panel.show")
        .forEach(p => p.classList.remove("show"));
}
