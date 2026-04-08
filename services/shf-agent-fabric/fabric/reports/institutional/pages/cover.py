from reportlab.lib.utils import ImageReader
import os

from ..layout import PAGE_H, PAGE_W, txt_c

COVER_IMAGE = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "../../assets/covers/shf_cover_ecosystem.png")
)

def render_cover_page(c, ctx, page_spec):
    if not os.path.exists(COVER_IMAGE):
        txt_c(c, PAGE_W / 2, PAGE_H / 2, f"Cover image not found: {COVER_IMAGE}", 12, font="Helvetica-Bold")
        return

    img = ImageReader(COVER_IMAGE)
    iw, ih = img.getSize()

    margin_x = 10
    margin_top = 8
    margin_bottom = 8

    max_w = PAGE_W - (margin_x * 2)
    max_h = PAGE_H - margin_top - margin_bottom

    scale = min(max_w / float(iw), max_h / float(ih))
    draw_w = iw * scale
    draw_h = ih * scale

    x = (PAGE_W - draw_w) / 2
    y = (PAGE_H - draw_h) / 2

    c.drawImage(
        img,
        x,
        y,
        width=draw_w,
        height=draw_h,
        preserveAspectRatio=True,
        mask="auto"
    )
