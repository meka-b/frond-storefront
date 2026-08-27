"use client"

import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { FindAndReplace } from "@tiptap/extension-find-and-replace"
import { Selection } from "@tiptap/extensions"
import { Placeholder } from "@tiptap/extension-placeholder"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import {
  SearchAndReplace,
  SearchAndReplaceButton,
} from "@/components/tiptap-ui/search-and-replace"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { Sparkles, CheckCircle2 } from "lucide-react"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

const SEARCH_AND_REPLACE_SCROLL_OPTIONS = {
  block: "center",
}

/**
 * SEO Optimizer for Tiptap HTML Output
 * Adds semantic image tags, lazy-loading, and clean microdata
 */
function optimizeSeoHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return ""
  let optimized = rawHtml
  // Add loading="lazy" & decoding="async" to images without them
  optimized = optimized.replace(
    /<img(?![^>]*\bloading=)([^>]*)>/gi,
    '<img loading="lazy" decoding="async"$1>'
  )
  return optimized
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onSearchAndReplaceClick,
  isSearchAndReplaceOpen,
  searchAndReplaceButtonRef,
  isMobile,
}) => {
  return (
    <>
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="underline" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>
      <Spacer />
      {isMobile && <ToolbarSeparator />}
      <ToolbarGroup>
        <SearchAndReplaceButton
          ref={searchAndReplaceButtonRef}
          aria-expanded={isSearchAndReplaceOpen}
          data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
          onClick={onSearchAndReplaceClick}
        />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({ type, onBack }) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({
  name = "content",
  value = "",
  onChange,
  label = "İçerik",
  description = "Tiptap Simple Editor (SEO Ready)",
  minHeight = "min-h-[220px]",
  placeholder = "Bitkinin karakteri, boyutu, teslimat ve bakım detayları...",
}) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState("main")
  const [isSearchAndReplaceOpen, setIsSearchAndReplaceOpen] = useState(false)
  const [stats, setStats] = useState({ chars: 0, words: 0 })
  const toolbarRef = useRef(null)
  const searchAndReplaceButtonRef = useRef(null)

  // Empty initial content by default (or the value passed from DB)
  const initialContent = useMemo(() => {
    if (value && typeof value === "string" && value.trim().length > 0) {
      return value
    }
    return ""
  }, [value])

  const editor = useEditor({
    immediatelyRender: false,
    content: initialContent,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      Placeholder.configure({
        placeholder,
      }),
      FindAndReplace.configure({
        searchDebounceMs: 500,
        injectCSS: false,
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    onUpdate({ editor: currentEditor }) {
      const rawHtml = currentEditor.getHTML()
      const seoHtml = optimizeSeoHtml(rawHtml)
      const input = document.getElementById(`tiptap-input-${name}`)
      if (input) {
        input.value = seoHtml
      }
      if (onChange) onChange(seoHtml)

      const text = currentEditor.getText() || ""
      setStats({
        chars: text.length,
        words: text.trim().split(/\s+/).filter(Boolean).length,
      })
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // Sync external value changes (e.g. from AI enrichment pipeline) to Tiptap editor
  useEffect(() => {
    if (!editor) return
    if (typeof value === "string") {
      const currentHtml = editor.getHTML()
      if (value !== currentHtml) {
        editor.commands.setContent(value, false)
        const input = document.getElementById(`tiptap-input-${name}`)
        if (input) input.value = value
        const text = editor.getText() || ""
        setStats({
          chars: text.length,
          words: text.trim().split(/\s+/).filter(Boolean).length,
        })
      }
    }
  }, [value, editor, name])

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  const openSearchAndReplace = useCallback(() => {
    setMobileView("main")
    setIsSearchAndReplaceOpen(true)
  }, [])

  const closeSearchAndReplace = useCallback(() => {
    setIsSearchAndReplaceOpen(false)
    searchAndReplaceButtonRef.current?.focus()
  }, [])

  const toggleSearchAndReplace = useCallback(() => {
    if (isSearchAndReplaceOpen) {
      closeSearchAndReplace()
      return
    }

    openSearchAndReplace()
  }, [closeSearchAndReplace, isSearchAndReplaceOpen, openSearchAndReplace])

  return (
    <div className="space-y-1.5 font-sans w-full max-w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#5C665A]">
            {label}
          </label>
          {description && (
            <span className="text-[11px] text-[#7A8377] font-mono">{description}</span>
          )}
        </div>
      )}

      {/* Hidden input storing the HTML value for Remix form submission */}
      <input
        type="hidden"
        id={`tiptap-input-${name}`}
        name={name}
        defaultValue={typeof value === "string" ? value : ""}
      />

      <div className="simple-editor-wrapper border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-[#0F172A] transition w-full max-w-full box-border">
        <EditorContext.Provider value={{ editor }}>
          <Toolbar
            ref={toolbarRef}
            className="w-full border-b border-[#E2E8F0] bg-[#FAF9F5] overflow-x-auto box-border"
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                onSearchAndReplaceClick={toggleSearchAndReplace}
                isSearchAndReplaceOpen={isSearchAndReplaceOpen}
                searchAndReplaceButtonRef={searchAndReplaceButtonRef}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>

          <SearchAndReplace
            className="simple-editor-search-and-replace"
            open={isSearchAndReplaceOpen}
            onOpen={openSearchAndReplace}
            onClose={closeSearchAndReplace}
            scrollIntoViewOptions={SEARCH_AND_REPLACE_SCROLL_OPTIONS}
          />

          <div className={`w-full bg-white box-border ${minHeight}`}>
            <EditorContent
              editor={editor}
              role="presentation"
              className="simple-editor-content w-full box-border outline-none"
            />
          </div>

          {/* Footer Status with SEO Ready Badge */}
          <div className="px-4 py-2 bg-[#FAF9F5] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B] font-mono select-none w-full box-border">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-medium text-[#1E293B]">
                <Sparkles className="w-3.5 h-3.5 text-[#D87A4F]" />
                Tiptap Simple Template
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                SEO Ready Semantics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>{stats.chars} karakter</span>
              <span>{stats.words} kelime</span>
            </div>
          </div>
        </EditorContext.Provider>
      </div>
    </div>
  )
}

export default SimpleEditor
