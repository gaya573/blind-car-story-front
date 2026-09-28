"""원더 공용 브랜드 혜택 이미지에서 원더굿라이프 로고·문구를 블라인드 카스토리로 바꾼 사본을 만든다.

브랜드 혜택(/api/content/promotions/brand)은 원더굿라이프 본사 사이트와 같은 데이터라 원본을 고칠 수 없다.
그래서 블라인드 사이트 전용 사본을 public/bcs/promotions/ 에 두고, 화면에서 원본 주소 대신 쓴다
(src/bcs/promotionRebrand.js 의 REBRANDED_IMAGES).

사용: python scripts/rebrand-promotion-images.py <원본 이미지 폴더>
  원본 폴더에는 <id>-imageUrl.img, <id>-topPromotionImage.img 가 있어야 한다.
  (관리자 이미지 주소에서 내려받아 이름만 맞추면 된다.)

템플릿 두 가지만 처리한다.
  partner : "신차 장기렌트·리스 원더굿라이프 x ○○캐피탈" 머리 + 하단 "원더굿라이프 고객 전용 특별 제휴 상품"
  holiday : 오른쪽 위 원더굿라이프 로고 + 같은 하단 문구 (연말 할인)
새 템플릿이 오면 아래 좌표를 추가한다.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else None
OUT = ROOT / 'public' / 'bcs' / 'promotions'
LOGO_SVG = ROOT / 'public' / 'bcs' / 'images' / 'brand' / 'carstory-logo.svg'
FONT = 'C:/Windows/Fonts/NotoSansKR-VF.ttf'

# id -> 템플릿. 로고 영역(box)은 템플릿 안에서도 몇 px씩 달라 id 별로 둔다.
PROMOTIONS = {
    83: {'template': 'partner', 'head': (172, 84, 575, 196), 'thumb': (240, 21, 309, 43)},
    81: {'template': 'partner', 'head': (170, 84, 573, 196), 'thumb': (240, 21, 309, 43)},
    84: {'template': 'partner', 'head': (165, 82, 568, 194), 'thumb': (240, 21, 309, 43)},
    80: {'template': 'partner', 'head': (180, 84, 583, 196), 'thumb': (240, 21, 309, 43)},
    86: {'template': 'holiday', 'head': (910, 62, 1192, 146), 'thumb': (320, 41, 382, 60)},
    85: {'template': 'holiday', 'head': (910, 62, 1192, 146), 'thumb': (320, 41, 382, 60)},
}
# 하단 문구의 "원더굿라이프 고객 전용" 부분 (오른쪽의 색 글씨 "특별 제휴 상품"은 그대로 둔다).
CAPTION_BOX = (78, 1318, 760, 1396)
CAPTION_TEXT = '블라인드 카스토리 고객 전용'


def load_logo():
    """로고 SVG 안의 PNG를 꺼내 흰 배경을 투명으로 바꾸고 여백을 자른다."""
    import base64
    import re

    data = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', LOGO_SVG.read_text(encoding='utf-8')).group(1)
    from io import BytesIO

    logo = Image.open(BytesIO(base64.b64decode(data))).convert('RGBA')
    # 바깥 흰 배경만 지운다(로고 안쪽 흰색은 검은 테두리로 막혀 있어 남는다).
    marker = (255, 0, 255, 255)
    for corner in [(0, 0), (logo.width - 1, 0), (0, logo.height - 1), (logo.width - 1, logo.height - 1)]:
        ImageDraw.floodfill(logo, corner, marker, thresh=60)
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            if pixels[x, y] == marker:
                pixels[x, y] = (0, 0, 0, 0)
    return logo.crop(logo.getbbox())


def fill_vertical(image, box):
    """box 안을 위·아래 경계 행 사이의 세로 보간으로 채워 글자·로고를 지운다(그라데이션 배경에 자연스럽다)."""
    x0, y0, x1, y1 = box
    px = image.load()
    for x in range(x0, x1):
        top = px[x, max(y0 - 1, 0)]
        bottom = px[x, min(y1, image.height - 1)]
        span = max(y1 - y0, 1)
        for y in range(y0, y1):
            t = (y - y0 + 1) / (span + 1)
            px[x, y] = tuple(round(top[c] * (1 - t) + bottom[c] * t) for c in range(3))


def paste_logo(image, logo, box, padding=0.08):
    x0, y0, x1, y1 = box
    height = int((y1 - y0) * (1 - padding * 2))
    width = int(logo.width * height / logo.height)
    if width > (x1 - x0):
        width = x1 - x0
        height = int(logo.height * width / logo.width)
    resized = logo.resize((width, height), Image.LANCZOS)
    left = x0 + ((x1 - x0) - width) // 2
    top = y0 + ((y1 - y0) - height) // 2
    image.paste(resized, (left, top), resized)


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except (OSError, AttributeError):
        pass
    return f


def draw_caption(image, template):
    x0, y0, x1, y1 = CAPTION_BOX
    fill_vertical(image, CAPTION_BOX)
    size = 62
    while size > 30:
        f = font(size)
        left, top, right, bottom = f.getbbox(CAPTION_TEXT)
        if right - left <= (x1 - x0) - 8:
            break
        size -= 1
    text_w = right - left
    # 원래 문구처럼 오른쪽(색 글씨 쪽)에 붙이고 세로 가운데 맞춤.
    x = x1 - 4 - text_w - left
    y = y0 + ((y1 - y0) - (bottom - top)) // 2 - top
    if template == 'partner':
        # 사진 배경 위 흰 글씨: 원본처럼 은은한 그림자를 깐다.
        shadow = Image.new('RGBA', image.size, (0, 0, 0, 0))
        ImageDraw.Draw(shadow).text((x + 2, y + 3), CAPTION_TEXT, font=f, fill=(0, 0, 0, 110))
        shadow = shadow.filter(ImageFilter.GaussianBlur(4))
        image.paste(shadow, (0, 0), shadow)
    ImageDraw.Draw(image).text((x, y), CAPTION_TEXT, font=f, fill=(255, 255, 255))


def main():
    if not SRC:
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    logo = load_logo()
    for pid, spec in PROMOTIONS.items():
        thumb = Image.open(SRC / f'{pid}-imageUrl.img').convert('RGB')
        fill_vertical(thumb, spec['thumb'])
        paste_logo(thumb, logo, spec['thumb'], padding=0.02)
        thumb.save(OUT / f'{pid}-thumb.jpg', quality=92)

        top = Image.open(SRC / f'{pid}-topPromotionImage.img').convert('RGB')
        fill_vertical(top, spec['head'])
        paste_logo(top, logo, spec['head'])
        draw_caption(top, spec['template'])
        top.save(OUT / f'{pid}-top.jpg', quality=86, optimize=True)
        print(pid, 'ok')


if __name__ == '__main__':
    main()
