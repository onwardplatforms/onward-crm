"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name?: string;
  email: string;
  image?: string;
}

interface MentionTextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
  teamMembers?: TeamMember[];
  placeholder?: string;
  className?: string;
}

export function MentionTextarea({
  value = "",
  onChange,
  onMentionsChange,
  teamMembers = [],
  placeholder = "Type @ to mention team members...",
  className,
}: MentionTextareaProps) {
  // Store the internal format with tokens
  const [internalText, setInternalText] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const isComposingRef = useRef(false);

  useEffect(() => {
    setInternalText(value);
  }, [value]);

  const filteredMembers = teamMembers.filter((member) => {
    const search = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search)
    );
  });

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const foundMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      foundMentions.push(match[2]); // Extract the user ID
    }
    return foundMentions;
  };

  const insertMention = (member: TeamMember) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Get the display value to find correct position
    const displayValue = toDisplayValue(internalText);
    const displayBeforeAt = displayValue.substring(0, cursorPosition - searchTerm.length - 1);

    // Create mention token for internal storage
    const displayName = member.name || member.email;
    const mentionToken = `@[${displayName}](${member.id})`;

    // Build new internal text
    const internalBeforeAt = internalText.substring(0, cursorPosition - searchTerm.length - 1);
    const internalAfterCursor = internalText.substring(cursorPosition);
    const newInternalText = internalBeforeAt + mentionToken + " " + internalAfterCursor;

    setInternalText(newInternalText);
    onChange?.(newInternalText);

    // Extract and update mentions
    const newMentions = extractMentions(newInternalText);
    setMentions(newMentions);
    onMentionsChange?.(newMentions);

    setShowSuggestions(false);
    setSearchTerm("");
    setSelectedIndex(0);

    // Set cursor position after mention in display format
    setTimeout(() => {
      const displayMention = `@${displayName}`;
      const newPos = displayBeforeAt.length + displayMention.length + 1;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  };

  // Convert between display format (@Name) and internal format (@[Name](id))
  const toDisplayValue = (internalText: string): string => {
    return internalText.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention dropdown navigation
    if (showSuggestions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      } else if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredMembers[selectedIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setSearchTerm("");
        return;
      }
    }

    // Handle backspace for mention tokens
    if (e.key === "Backspace" && !isComposingRef.current) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Only handle if no text is selected
      if (start === end && start > 0) {
        // Get the display value and check what's before cursor
        const displayVal = toDisplayValue(internalText);
        const charBeforeCursor = displayVal[start - 1];

        // Check if we're at the end of a mention in display format
        if (charBeforeCursor && charBeforeCursor.match(/[a-zA-Z0-9']/)) {
          // Look backwards to find @ symbol
          let mentionStart = start - 1;
          while (mentionStart > 0 && displayVal[mentionStart - 1] !== '@') {
            mentionStart--;
          }

          if (mentionStart > 0 && displayVal[mentionStart - 1] === '@') {
            mentionStart--; // Include the @ symbol

            // Extract the mention name
            const mentionName = displayVal.substring(mentionStart + 1, start);

            // Check if this corresponds to a mention token in the internal format
            const mentionRegex = new RegExp(`@\\[${mentionName}\\]\\([^)]+\\)`, 'g');
            if (internalText.match(mentionRegex)) {
              e.preventDefault();

              // Remove the entire mention from internal format
              const newInternalText = internalText.replace(mentionRegex, '');
              setInternalText(newInternalText);
              onChange?.(newInternalText);

              // Update mentions
              const newMentions = extractMentions(newInternalText);
              setMentions(newMentions);
              onMentionsChange?.(newMentions);

              // Set cursor position
              setTimeout(() => {
                textarea.setSelectionRange(mentionStart, mentionStart);
              }, 0);
            }
          }
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplayValue = e.target.value;
    const pos = e.target.selectionStart;
    setCursorPosition(pos);

    const oldDisplayValue = toDisplayValue(internalText);

    // If display value hasn't changed, just update cursor
    if (newDisplayValue === oldDisplayValue) {
      return;
    }

    // For simple implementation, preserve existing mentions and handle new text
    // This approach maintains mentions while allowing normal typing
    let workingText = internalText;

    // If we're typing normally (not inside a mention)
    const diff = newDisplayValue.length - oldDisplayValue.length;

    if (diff > 0) {
      // Text was added
      const insertedText = newDisplayValue.slice(pos - diff, pos);

      // Find approximate position in internal text
      let internalPos = pos - diff;
      const mentions = internalText.matchAll(/@\[([^\]]+)\]\(([^)]+)\)/g);
      let offset = 0;
      for (const match of mentions) {
        if (match.index! < internalPos + offset) {
          // Add the difference between internal and display format
          offset += match[0].length - match[1].length - 1; // -1 for @
        }
      }
      internalPos += offset;

      // Insert the new text at the calculated position
      workingText = internalText.slice(0, internalPos) + insertedText + internalText.slice(internalPos);
    } else if (diff < 0) {
      // Text was deleted - for simplicity, just sync with display
      // This might break mentions but keeps things simple
      workingText = newDisplayValue;
    }

    setInternalText(workingText);
    onChange?.(workingText);

    // Check for @ symbol to show suggestions
    const beforeCursor = newDisplayValue.substring(0, pos);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.substring(lastAtIndex + 1);
      // Check if we're still in a mention context (no spaces or special chars)
      if (!afterAt.match(/[\s\[\]\(\)]/)) {
        setSearchTerm(afterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
        setSearchTerm("");
      }
    } else {
      setShowSuggestions(false);
      setSearchTerm("");
    }

    // Update mentions
    const newMentions = extractMentions(workingText);
    setMentions(newMentions);
    onMentionsChange?.(newMentions);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={toDisplayValue(internalText)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={() => (isComposingRef.current = false)}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30",
          "flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      />

      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-md">
          {filteredMembers.map((member, index) => {
            const displayName = member.name || member.email;
            return (
              <button
                key={member.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                  "text-left transition-colors",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertMention(member);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium">{member.name || member.email}</div>
                  {member.name && (
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Visual feedback for mentions */}
      {mentions.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          {mentions.length} user{mentions.length !== 1 ? "s" : ""} will be notified
        </div>
      )}
    </div>
  );
}