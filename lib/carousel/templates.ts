// ---------------------------------------------------------------------------
// Premium LinkedIn carousel template library.
//
// Each template is metadata plus a pure `build` function that returns a
// fully-populated CarouselDocument using only the frozen factory helpers and
// theme tokens. Geometry stays inside the safe area (x in 88..992, y in
// 88..canvasH-88 on a 1080-wide canvas). Hook/CTA slides use the hero gradient
// with accentText copy; body slides use the bg token with text-token copy.
// ---------------------------------------------------------------------------

import {
    CANVAS_SIZES,
    CAROUSEL_VERSION,
    type CanvasRatio,
    type CarouselDocument,
    type CarouselElement,
    type Slide,
} from '@/lib/carousel/types'

import { createIconElement, createShapeElement, createSlide, createTextElement, DEFAULT_CHROME } from './factory'
import { DEFAULT_THEME_ID } from './theme'

export type TemplateCategory = 'List' | 'How-to' | 'Story' | 'Comparison' | 'Data' | 'Quote' | 'Cover'

export type CarouselTemplate = {
    id: string
    name: string
    category: TemplateCategory
    description: string
    recommendedSlides: number
    build: (opts: { themeId?: string; ratio?: CanvasRatio }) => CarouselDocument
}

type BuildOpts = { themeId?: string; ratio?: CanvasRatio }

// Canvas-space constants for a 1080-wide artboard. The safe box runs
// x: 88..992 (904px wide). Helpers below center on that box.
const MARGIN = 88
const CONTENT_WIDTH = 904

const HERO_BG = { type: 'gradient' as const, value: 'hero' }
const BODY_BG = { type: 'token' as const, token: 'bg' as const }

/** Assemble a document from slides, wiring canvas/theme/chrome defaults. */
const buildDocument = (opts: BuildOpts, slides: Slide[]): CarouselDocument => {
    const ratio = opts.ratio ?? '4:5'
    return {
        kind: 'carousel',
        version: CAROUSEL_VERSION,
        canvas: CANVAS_SIZES[ratio],
        themeId: opts.themeId ?? DEFAULT_THEME_ID,
        brandChrome: { ...DEFAULT_CHROME },
        slides,
    }
}

// ---------------------------------------------------------------------------
// Shared slide builders
// ---------------------------------------------------------------------------

/** Big-statement hook slide on the hero gradient. */
const hookSlide = (title: string, kicker: string, sub: string): Slide =>
    createSlide(
        'hook',
        [
            createTextElement({
                text: kicker,
                x: MARGIN,
                y: 200,
                width: CONTENT_WIDTH,
                height: 64,
                fontToken: 'body',
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 2,
                colorToken: 'accentText',
                opacity: 0.8,
            }),
            createShapeElement({
                shape: 'rect',
                x: MARGIN,
                y: 296,
                width: 120,
                height: 10,
                fillToken: 'accentText',
                radius: 999,
                opacity: 0.9,
            }),
            createTextElement({
                text: title,
                x: MARGIN,
                y: 360,
                width: CONTENT_WIDTH,
                height: 520,
                fontToken: 'heading',
                fontSize: 96,
                fontWeight: 800,
                lineHeight: 1.04,
                colorToken: 'accentText',
            }),
            createTextElement({
                text: sub,
                x: MARGIN,
                y: 1080,
                width: CONTENT_WIDTH,
                height: 150,
                fontToken: 'body',
                fontSize: 36,
                colorToken: 'accentText',
                opacity: 0.85,
            }),
        ],
        HERO_BG,
    )

/** Closing CTA slide on the hero gradient. */
const ctaSlide = (title = 'Found this useful?', sub = 'Follow for a new playbook every week.'): Slide =>
    createSlide(
        'cta',
        [
            createIconElement({
                name: 'sparkles',
                x: MARGIN,
                y: 360,
                width: 110,
                height: 110,
                colorToken: 'accentText',
                strokeWidth: 2.5,
            }),
            createTextElement({
                text: title,
                x: MARGIN,
                y: 500,
                width: CONTENT_WIDTH,
                height: 320,
                fontToken: 'heading',
                fontSize: 84,
                fontWeight: 800,
                lineHeight: 1.06,
                colorToken: 'accentText',
            }),
            createTextElement({
                text: sub,
                x: MARGIN,
                y: 840,
                width: CONTENT_WIDTH,
                height: 130,
                fontToken: 'body',
                fontSize: 38,
                colorToken: 'accentText',
                opacity: 0.85,
            }),
            createTextElement({
                text: 'Repost to help someone in your network',
                x: MARGIN,
                y: 1140,
                width: CONTENT_WIDTH,
                height: 60,
                fontToken: 'body',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 1,
                colorToken: 'accentText',
                opacity: 0.7,
            }),
        ],
        HERO_BG,
    )

/** A standard body slide: small kicker, accent bar, big heading, paragraph. */
const bodySlide = (kicker: string, heading: string, body: string): Slide =>
    createSlide(
        'body',
        [
            createTextElement({
                text: kicker,
                x: MARGIN,
                y: 200,
                width: CONTENT_WIDTH,
                height: 56,
                fontToken: 'body',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 2,
                colorToken: 'accent',
            }),
            createShapeElement({
                shape: 'rect',
                x: MARGIN,
                y: 276,
                width: 96,
                height: 8,
                fillToken: 'accent',
                radius: 999,
            }),
            createTextElement({
                text: heading,
                x: MARGIN,
                y: 332,
                width: CONTENT_WIDTH,
                height: 340,
                fontToken: 'heading',
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.08,
                colorToken: 'text',
            }),
            createTextElement({
                text: body,
                x: MARGIN,
                y: 720,
                width: CONTENT_WIDTH,
                height: 360,
                fontToken: 'body',
                fontSize: 40,
                lineHeight: 1.4,
                colorToken: 'muted',
            }),
        ],
        BODY_BG,
    )

/** A numbered body slide with a large number badge. */
const numberedSlide = (n: number, heading: string, body: string): Slide =>
    createSlide(
        'body',
        [
            createShapeElement({
                shape: 'ellipse',
                x: MARGIN,
                y: 200,
                width: 128,
                height: 128,
                fillToken: 'accent',
                radius: 999,
            }),
            createTextElement({
                text: String(n),
                x: MARGIN,
                y: 200,
                width: 128,
                height: 128,
                fontToken: 'heading',
                fontSize: 64,
                fontWeight: 800,
                align: 'center',
                valign: 'middle',
                colorToken: 'accentText',
            }),
            createTextElement({
                text: heading,
                x: MARGIN,
                y: 372,
                width: CONTENT_WIDTH,
                height: 280,
                fontToken: 'heading',
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.08,
                colorToken: 'text',
            }),
            createTextElement({
                text: body,
                x: MARGIN,
                y: 700,
                width: CONTENT_WIDTH,
                height: 340,
                fontToken: 'body',
                fontSize: 40,
                lineHeight: 1.4,
                colorToken: 'muted',
            }),
        ],
        BODY_BG,
    )

/** A row of icon + label + line, used for checklists/cheat-sheets. */
const iconRow = (
    icon: string,
    label: string,
    y: number,
    colorToken: 'accent' | 'muted' = 'accent',
): CarouselElement[] => [
    createIconElement({
        name: icon,
        x: MARGIN,
        y,
        width: 64,
        height: 64,
        colorToken,
        strokeWidth: 2.5,
    }),
    createTextElement({
        text: label,
        x: MARGIN + 96,
        y: y - 2,
        width: CONTENT_WIDTH - 96,
        height: 68,
        fontToken: 'body',
        fontSize: 40,
        fontWeight: 600,
        valign: 'middle',
        colorToken: 'text',
    }),
]

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

const buildBigStatement = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide('Stop posting into the void.', 'THE HARD TRUTH', 'One idea, said boldly, beats ten said softly.'),
        bodySlide(
            'WHY IT MATTERS',
            'Attention is the only currency on the feed.',
            'Your first line decides whether anyone reads the rest. Lead with the boldest version of your point, then earn it.',
        ),
        bodySlide(
            'THE SHIFT',
            'Pick one statement worth defending.',
            'If you cannot fit your idea on a billboard, it is not sharp enough yet. Cut until it stings a little.',
        ),
        ctaSlide('Say the bold thing.', 'Follow for sharper writing every week.'),
    ])

const buildNumberedList = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            '5 mistakes killing your reach',
            'GROWTH PLAYBOOK',
            'Most creators make at least three of these. Swipe.',
        ),
        numberedSlide(
            1,
            'You bury the hook.',
            'The payoff lives in line four. Move it to line one - nobody taps "see more" for a warm-up.',
        ),
        numberedSlide(
            2,
            'You post and ghost.',
            'The algorithm watches the first 60 minutes. Reply to every comment fast to compound the reach.',
        ),
        numberedSlide(
            3,
            'You write for everyone.',
            'A post aimed at all gets read by none. Name the exact person you are talking to.',
        ),
        numberedSlide(
            4,
            'You add a link in the post.',
            'Outbound links get throttled. Put the link in the first comment instead.',
        ),
        numberedSlide(
            5,
            'You never ask anything.',
            'A clear question at the end is the cheapest engagement you will ever buy. Use it.',
        ),
        ctaSlide('Which one are you guilty of?', 'Save this and fix one per week.'),
    ])

const buildFramework = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            'The 3-part hook framework',
            'WRITE BETTER',
            'A repeatable structure for openers that stop the scroll.',
        ),
        bodySlide(
            'PART 1 - TENSION',
            'Name a problem they feel right now.',
            'Open on the pain, not the solution. "Your posts get 12 likes and you do not know why" beats any clever phrasing.',
        ),
        bodySlide(
            'PART 2 - TWIST',
            'Say the thing they did not expect.',
            'Subvert the obvious advice. The gap between what they assumed and what is true is what earns the swipe.',
        ),
        bodySlide(
            'PART 3 - PROMISE',
            'Tell them exactly what they will get.',
            'Close the hook with the payoff: "Here are the 3 moves that fixed it." Now they have a reason to keep reading.',
        ),
        ctaSlide('Steal this framework.', 'Follow for more writing systems.'),
    ])

const buildHowTo = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide('How to write a viral hook in 4 steps', 'STEP-BY-STEP', 'No theory. Just the exact sequence I use.'),
        numberedSlide(
            1,
            'Start from the comment you want.',
            'Decide the reaction first ("oh, I do that too"), then reverse-engineer the line that triggers it.',
        ),
        numberedSlide(
            2,
            'Draft 10 versions, fast.',
            'Quantity unlocks quality. Write ten ugly hooks in five minutes before you judge a single one.',
        ),
        numberedSlide(
            3,
            'Cut every word that is not load-bearing.',
            'Read each hook aloud. If a word can leave without changing the meaning, delete it.',
        ),
        numberedSlide(
            4,
            'Test the first line alone.',
            'Paste only line one to a friend. If they want line two, you have a hook. If not, rewrite.',
        ),
        ctaSlide('Now go write 10 hooks.', 'Follow for the full posting system.'),
    ])

const buildBeforeAfter = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            'Same idea. Two very different posts.',
            'BEFORE / AFTER',
            'A 4-word edit took this from ignored to shared.',
        ),
        createSlide(
            'body',
            [
                createTextElement({
                    text: 'BEFORE',
                    x: MARGIN,
                    y: 200,
                    width: CONTENT_WIDTH,
                    height: 56,
                    fontToken: 'body',
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: 3,
                    colorToken: 'muted',
                }),
                createShapeElement({
                    shape: 'rect',
                    x: MARGIN,
                    y: 296,
                    width: CONTENT_WIDTH,
                    height: 360,
                    fillToken: 'surface',
                    radius: 28,
                }),
                createTextElement({
                    text: '"Here are some tips I learned about content marketing this year that might be helpful for you."',
                    x: MARGIN + 48,
                    y: 348,
                    width: CONTENT_WIDTH - 96,
                    height: 264,
                    fontToken: 'body',
                    fontSize: 40,
                    lineHeight: 1.35,
                    valign: 'middle',
                    colorToken: 'muted',
                }),
                createTextElement({
                    text: 'AFTER',
                    x: MARGIN,
                    y: 720,
                    width: CONTENT_WIDTH,
                    height: 56,
                    fontToken: 'body',
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: 3,
                    colorToken: 'accent',
                }),
                createShapeElement({
                    shape: 'rect',
                    x: MARGIN,
                    y: 816,
                    width: CONTENT_WIDTH,
                    height: 360,
                    fillToken: 'accent',
                    radius: 28,
                }),
                createTextElement({
                    text: '"I wasted a year on content nobody read. Here is the one rule that finally changed it."',
                    x: MARGIN + 48,
                    y: 868,
                    width: CONTENT_WIDTH - 96,
                    height: 264,
                    fontToken: 'body',
                    fontSize: 42,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    valign: 'middle',
                    colorToken: 'accentText',
                }),
            ],
            BODY_BG,
        ),
        bodySlide(
            'THE DIFFERENCE',
            'Specific beats safe, every time.',
            'The "after" version names a real cost and a single promise. Vague helpfulness gets scrolled; a sharp stake gets read.',
        ),
        ctaSlide('Rewrite your last post.', 'Follow for daily before/after teardowns.'),
    ])

const buildComparison = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide('Scheduling vs. posting live', 'A vs. B', 'Both work. Only one fits how you actually create.'),
        createSlide(
            'body',
            [
                createTextElement({
                    text: 'Pick the workflow that survives a busy week',
                    x: MARGIN,
                    y: 180,
                    width: CONTENT_WIDTH,
                    height: 150,
                    fontToken: 'heading',
                    fontSize: 56,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    colorToken: 'text',
                }),
                // Column A
                createShapeElement({
                    shape: 'rect',
                    x: MARGIN,
                    y: 380,
                    width: 432,
                    height: 720,
                    fillToken: 'surface',
                    radius: 28,
                }),
                createTextElement({
                    text: 'Scheduling',
                    x: MARGIN + 40,
                    y: 420,
                    width: 352,
                    height: 80,
                    fontToken: 'heading',
                    fontSize: 48,
                    fontWeight: 800,
                    colorToken: 'text',
                }),
                createTextElement({
                    text: 'Batch a week in one sitting\nNever miss a day\nNeeds a content buffer\nLess reactive to news',
                    x: MARGIN + 40,
                    y: 520,
                    width: 352,
                    height: 540,
                    fontToken: 'body',
                    fontSize: 34,
                    lineHeight: 1.6,
                    colorToken: 'muted',
                }),
                // Column B
                createShapeElement({
                    shape: 'rect',
                    x: 560,
                    y: 380,
                    width: 432,
                    height: 720,
                    fillToken: 'accent',
                    radius: 28,
                }),
                createTextElement({
                    text: 'Posting live',
                    x: 600,
                    y: 420,
                    width: 352,
                    height: 80,
                    fontToken: 'heading',
                    fontSize: 48,
                    fontWeight: 800,
                    colorToken: 'accentText',
                }),
                createTextElement({
                    text: 'Ride trends instantly\nFeels more authentic\nEasy to skip a day\nHard to stay consistent',
                    x: 600,
                    y: 520,
                    width: 352,
                    height: 540,
                    fontToken: 'body',
                    fontSize: 34,
                    lineHeight: 1.6,
                    colorToken: 'accentText',
                    opacity: 0.9,
                }),
            ],
            BODY_BG,
        ),
        bodySlide(
            'THE VERDICT',
            'Schedule the base. Post live for the spikes.',
            'Use a buffer for your consistent output, then break it whenever something timely is worth reacting to.',
        ),
        ctaSlide('Which camp are you in?', 'Follow for more workflow breakdowns.'),
    ])

const buildBigNumber = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            'One number that changed how I post',
            'BY THE NUMBERS',
            'It is smaller than you think, and it explains everything.',
        ),
        createSlide(
            'body',
            [
                createTextElement({
                    text: '0.4%',
                    x: MARGIN,
                    y: 360,
                    width: CONTENT_WIDTH,
                    height: 320,
                    fontToken: 'heading',
                    fontSize: 280,
                    fontWeight: 800,
                    align: 'center',
                    lineHeight: 1,
                    colorToken: 'accent',
                }),
                createTextElement({
                    text: 'of your followers see any given post',
                    x: MARGIN,
                    y: 720,
                    width: CONTENT_WIDTH,
                    height: 120,
                    fontToken: 'heading',
                    fontSize: 52,
                    fontWeight: 700,
                    align: 'center',
                    colorToken: 'text',
                }),
                createTextElement({
                    text: 'Organic reach is brutal. The fix is not posting more - it is making the few who see it stop and act.',
                    x: MARGIN,
                    y: 880,
                    width: CONTENT_WIDTH,
                    height: 200,
                    fontToken: 'body',
                    fontSize: 38,
                    align: 'center',
                    lineHeight: 1.4,
                    colorToken: 'muted',
                }),
            ],
            BODY_BG,
        ),
        ctaSlide('Make every impression count.', 'Follow for data-backed posting tips.'),
    ])

const buildPullQuote = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            'The best advice I ever got about LinkedIn',
            'WORTH REPEATING',
            'It took me three years to actually believe it.',
        ),
        createSlide(
            'body',
            [
                createIconElement({
                    name: 'quote',
                    x: MARGIN,
                    y: 280,
                    width: 120,
                    height: 120,
                    colorToken: 'accent',
                    strokeWidth: 2,
                }),
                createTextElement({
                    text: 'Write like you are helping one person, not impressing one thousand.',
                    x: MARGIN,
                    y: 440,
                    width: CONTENT_WIDTH,
                    height: 480,
                    fontToken: 'heading',
                    fontSize: 76,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    colorToken: 'text',
                }),
                createShapeElement({
                    shape: 'rect',
                    x: MARGIN,
                    y: 960,
                    width: 96,
                    height: 8,
                    fillToken: 'accent',
                    radius: 999,
                }),
                createTextElement({
                    text: 'A mentor who never posted, but always knew',
                    x: MARGIN,
                    y: 1000,
                    width: CONTENT_WIDTH,
                    height: 80,
                    fontToken: 'body',
                    fontSize: 32,
                    fontWeight: 600,
                    colorToken: 'muted',
                }),
            ],
            BODY_BG,
        ),
        ctaSlide('Tag someone who needs this.', 'Follow for more honest LinkedIn advice.'),
    ])

const buildChecklist = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            'The pre-publish checklist I never skip',
            'BEFORE YOU POST',
            '6 checks that quietly double engagement.',
        ),
        createSlide(
            'body',
            [
                createTextElement({
                    text: 'Run this before you hit publish',
                    x: MARGIN,
                    y: 180,
                    width: CONTENT_WIDTH,
                    height: 130,
                    fontToken: 'heading',
                    fontSize: 56,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    colorToken: 'text',
                }),
                ...iconRow('check-circle', 'Hook fits on one line', 360),
                ...iconRow('check-circle', 'First sentence has no fluff', 472),
                ...iconRow('check-circle', 'One idea, not five', 584),
                ...iconRow('check-circle', 'Line breaks every 1-2 sentences', 696),
                ...iconRow('check-circle', 'Clear question at the end', 808),
                ...iconRow('check-circle', 'Link sits in the comments', 920),
            ],
            BODY_BG,
        ),
        ctaSlide('Save this checklist.', 'Follow so the next one finds you.'),
    ])

const buildMythBuster = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            '3 LinkedIn myths costing you reach',
            'MYTH vs. FACT',
            'You have probably believed at least one of these.',
        ),
        createSlide(
            'body',
            [
                createIconElement({
                    name: 'x',
                    x: MARGIN,
                    y: 210,
                    width: 72,
                    height: 72,
                    colorToken: 'muted',
                    strokeWidth: 3,
                }),
                createTextElement({
                    text: 'Myth: post at 9am or you lose.',
                    x: MARGIN + 104,
                    y: 210,
                    width: CONTENT_WIDTH - 104,
                    height: 100,
                    fontToken: 'heading',
                    fontSize: 52,
                    fontWeight: 800,
                    valign: 'middle',
                    colorToken: 'muted',
                }),
                createIconElement({
                    name: 'check-circle',
                    x: MARGIN,
                    y: 420,
                    width: 72,
                    height: 72,
                    colorToken: 'accent',
                    strokeWidth: 3,
                }),
                createTextElement({
                    text: 'Fact: your best time is when your people are online.',
                    x: MARGIN + 104,
                    y: 420,
                    width: CONTENT_WIDTH - 104,
                    height: 220,
                    fontToken: 'body',
                    fontSize: 44,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    colorToken: 'text',
                }),
                createTextElement({
                    text: 'A great post at the "wrong" time still beats a weak post at the "right" one. Watch your own analytics, not a generic chart.',
                    x: MARGIN,
                    y: 720,
                    width: CONTENT_WIDTH,
                    height: 360,
                    fontToken: 'body',
                    fontSize: 40,
                    lineHeight: 1.4,
                    colorToken: 'muted',
                }),
            ],
            BODY_BG,
        ),
        bodySlide(
            'MYTH #2',
            'Myth: hashtags boost your reach.',
            'Fact: they barely move the needle now. One or two for context is plenty - stuffing ten looks desperate and does nothing.',
        ),
        ctaSlide('Stop following bad advice.', 'Follow for myths busted weekly.'),
    ])

const buildCaseStudy = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide('How one post got 1.2M views', 'CASE STUDY', 'No ads. No following. Just a structure you can copy.'),
        bodySlide(
            'THE PROBLEM',
            'Great work, zero visibility.',
            'A solo founder shipped for two years and had 400 followers. Brilliant product, no audience, no inbound at all.',
        ),
        bodySlide(
            'THE ACTION',
            'One build-in-public post, told as a story.',
            'They wrote the messy version: the failed launch, the exact number that scared them, and the single decision that turned it around.',
        ),
        createSlide(
            'body',
            [
                createTextElement({
                    text: 'THE RESULT',
                    x: MARGIN,
                    y: 200,
                    width: CONTENT_WIDTH,
                    height: 56,
                    fontToken: 'body',
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: 2,
                    colorToken: 'accent',
                }),
                createTextElement({
                    text: '1.2M',
                    x: MARGIN,
                    y: 300,
                    width: 432,
                    height: 200,
                    fontToken: 'heading',
                    fontSize: 140,
                    fontWeight: 800,
                    colorToken: 'accent',
                }),
                createTextElement({
                    text: 'views in 6 days',
                    x: MARGIN,
                    y: 500,
                    width: 432,
                    height: 80,
                    fontToken: 'body',
                    fontSize: 34,
                    colorToken: 'muted',
                }),
                createTextElement({
                    text: '+9k',
                    x: 560,
                    y: 300,
                    width: 432,
                    height: 200,
                    fontToken: 'heading',
                    fontSize: 140,
                    fontWeight: 800,
                    colorToken: 'text',
                }),
                createTextElement({
                    text: 'new followers',
                    x: 560,
                    y: 500,
                    width: 432,
                    height: 80,
                    fontToken: 'body',
                    fontSize: 34,
                    colorToken: 'muted',
                }),
                createTextElement({
                    text: 'The lesson: honesty scales. The post that helped them was the one they were almost too embarrassed to publish.',
                    x: MARGIN,
                    y: 680,
                    width: CONTENT_WIDTH,
                    height: 400,
                    fontToken: 'body',
                    fontSize: 42,
                    lineHeight: 1.4,
                    colorToken: 'text',
                }),
            ],
            BODY_BG,
        ),
        ctaSlide('Tell your real story.', 'Follow for more breakdowns like this.'),
    ])

const buildMistakes = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide('Mistakes to avoid in your first 90 days', 'AVOID THESE', 'Every one of these set me back months.'),
        createSlide(
            'body',
            [
                createIconElement({
                    name: 'alert-triangle',
                    x: MARGIN,
                    y: 200,
                    width: 96,
                    height: 96,
                    colorToken: 'accent',
                    strokeWidth: 2.5,
                }),
                createTextElement({
                    text: 'Mistake #1',
                    x: MARGIN,
                    y: 320,
                    width: CONTENT_WIDTH,
                    height: 64,
                    fontToken: 'body',
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: 2,
                    colorToken: 'accent',
                }),
                createTextElement({
                    text: 'Chasing virality before clarity.',
                    x: MARGIN,
                    y: 396,
                    width: CONTENT_WIDTH,
                    height: 260,
                    fontToken: 'heading',
                    fontSize: 68,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    colorToken: 'text',
                }),
                createTextElement({
                    text: 'A viral post for the wrong audience just brings the wrong people. Get your positioning right first, then scale it.',
                    x: MARGIN,
                    y: 700,
                    width: CONTENT_WIDTH,
                    height: 360,
                    fontToken: 'body',
                    fontSize: 40,
                    lineHeight: 1.4,
                    colorToken: 'muted',
                }),
            ],
            BODY_BG,
        ),
        bodySlide(
            'MISTAKE #2',
            'Copying creators in other niches.',
            'What works for a fitness coach will flop for a B2B consultant. Borrow the structure, never the voice.',
        ),
        bodySlide(
            'MISTAKE #3',
            'Quitting right before it works.',
            'Most give up around week six - the exact point compounding kicks in. Boring consistency beats brilliant bursts.',
        ),
        ctaSlide('Skip the mistakes I made.', 'Follow to shortcut your first 90 days.'),
    ])

const buildCheatSheet = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide('The LinkedIn hook cheat-sheet', 'SAVE THIS', '7 plug-and-play openers you can use today.'),
        createSlide(
            'body',
            [
                createTextElement({
                    text: 'Steal these opening lines',
                    x: MARGIN,
                    y: 170,
                    width: CONTENT_WIDTH,
                    height: 120,
                    fontToken: 'heading',
                    fontSize: 56,
                    fontWeight: 800,
                    colorToken: 'text',
                }),
                ...iconRow('zap', 'Unpopular opinion:', 330),
                ...iconRow('target', 'I was wrong about...', 432),
                ...iconRow('trending-up', 'Here is what nobody tells you:', 534),
                ...iconRow('lightbulb', 'The fastest way to...', 636),
                ...iconRow('flame', 'Stop doing X. Do this instead.', 738),
                ...iconRow('star', 'It took me 5 years to learn this:', 840),
                ...iconRow('rocket', 'Want X without Y? Read this.', 942),
            ],
            BODY_BG,
        ),
        ctaSlide('Bookmark the cheat-sheet.', 'Follow for more swipe files.'),
    ])

const buildStory = (opts: BuildOpts): CarouselDocument =>
    buildDocument(opts, [
        hookSlide(
            'I almost deleted my LinkedIn last year.',
            'A SHORT STORY',
            'Then one comment changed my mind. Swipe.',
        ),
        bodySlide(
            'THE LOW POINT',
            'Six months, nothing landing.',
            'I posted three times a week into total silence. I convinced myself the platform was dead and the effort was wasted.',
        ),
        bodySlide(
            'THE TURN',
            'One stranger replied: "This helped me."',
            'Not a viral moment. One person. But it reframed everything - I had been counting likes when I should have been counting people helped.',
        ),
        bodySlide(
            'THE LESSON',
            'Write for the one, not the thousand.',
            'I stopped optimizing for reach and started writing to a single real person. Ironically, that is when the reach finally came.',
        ),
        ctaSlide('Do not delete it. Refocus it.', 'Follow if this hit home.'),
    ])

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const TEMPLATES: CarouselTemplate[] = [
    {
        id: 'big-statement',
        name: 'Big-Statement Hook',
        category: 'Cover',
        description: 'A single bold claim on a full-bleed gradient, backed by two reinforcing slides.',
        recommendedSlides: 4,
        build: buildBigStatement,
    },
    {
        id: 'numbered-list',
        name: 'Numbered List',
        category: 'List',
        description: 'A classic listicle with five numbered takeaways between a hook and CTA.',
        recommendedSlides: 7,
        build: buildNumberedList,
    },
    {
        id: 'framework',
        name: '3-Part Framework',
        category: 'How-to',
        description: 'Break a method into three named parts that build on each other.',
        recommendedSlides: 5,
        build: buildFramework,
    },
    {
        id: 'how-to',
        name: 'Step-by-Step How-To',
        category: 'How-to',
        description: 'Four numbered action steps that walk through a process end to end.',
        recommendedSlides: 6,
        build: buildHowTo,
    },
    {
        id: 'before-after',
        name: 'Before / After',
        category: 'Comparison',
        description: 'Contrast a weak version against a strong one, then explain the difference.',
        recommendedSlides: 4,
        build: buildBeforeAfter,
    },
    {
        id: 'comparison',
        name: 'A vs. B Comparison',
        category: 'Comparison',
        description: 'A two-column face-off that weighs two options and lands on a verdict.',
        recommendedSlides: 4,
        build: buildComparison,
    },
    {
        id: 'big-number',
        name: 'Big-Number Stat',
        category: 'Data',
        description: 'One oversized statistic as the centrepiece, framed by context and a takeaway.',
        recommendedSlides: 3,
        build: buildBigNumber,
    },
    {
        id: 'pull-quote',
        name: 'Pull-Quote',
        category: 'Quote',
        description: 'A single memorable quote, attributed, with a setup and a share prompt.',
        recommendedSlides: 3,
        build: buildPullQuote,
    },
    {
        id: 'checklist',
        name: 'Checklist',
        category: 'List',
        description: 'Icon-and-line rows that read as a quick, saveable checklist.',
        recommendedSlides: 3,
        build: buildChecklist,
    },
    {
        id: 'myth-buster',
        name: 'Myth-Buster',
        category: 'Comparison',
        description: 'Pair each myth with the fact that replaces it to reset assumptions.',
        recommendedSlides: 4,
        build: buildMythBuster,
    },
    {
        id: 'case-study',
        name: 'Case Study',
        category: 'Story',
        description: 'A problem-to-action-to-result arc with a results slide built from big numbers.',
        recommendedSlides: 5,
        build: buildCaseStudy,
    },
    {
        id: 'mistakes',
        name: 'Mistakes to Avoid',
        category: 'List',
        description: 'Three cautionary mistakes, each with the fix, opened by a warning hook.',
        recommendedSlides: 5,
        build: buildMistakes,
    },
    {
        id: 'cheat-sheet',
        name: 'Cheat-Sheet',
        category: 'List',
        description: 'A dense, icon-led swipe file of plug-and-play lines worth saving.',
        recommendedSlides: 3,
        build: buildCheatSheet,
    },
    {
        id: 'story',
        name: 'Story Arc',
        category: 'Story',
        description: 'A personal low-point-to-lesson narrative with a CTA/closing slide.',
        recommendedSlides: 5,
        build: buildStory,
    },
]

const TEMPLATE_MAP: Record<string, CarouselTemplate> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]))

export function getTemplate(id: string): CarouselTemplate | undefined {
    return TEMPLATE_MAP[id]
}
