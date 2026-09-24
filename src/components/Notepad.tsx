/**
 * ORION-9 NOTEPAD APPLICATION
 * Full-featured desktop text editor with virtual file system integration,
 * Save / Save As / Open file dialogs, keyboard shortcuts, word & character counts,
 * find & replace, formatting options, and multi-tenant persistence.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  FilePlus,
  FolderOpen,
  FileText,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Download,
  WrapText,
  Type,
  Maximize2,
  Minimize2,
  Folder,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { orionFileSystemService, SYSTEM_FOLDERS } from '../core/filesystem/OrionFileSystemService';
import { OrionFile, OrionFolder } from '../core/filesystem/types';
import { useToast } from '../store/ToastContext';
import { useAuth } from '../store/AuthContext';
import { cn } from '../lib/utils';

export interface NotepadProps {
  initialFileId?: string;
  onClose?: () => void;
}

export function Notepad({ initialFileId, onClose }: NotepadProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentFile, setCurrentFile] = useState<OrionFile | null>(null);
  const [content, setContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Untitled.txt');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isWordWrap, setIsWordWrap] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans'>('mono');
  const [fontSize, setFontSize] = useState<number>(14);

  // Dialogs
  const [isSaveAsOpen, setIsSaveAsOpen] = useState<boolean>(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState<boolean>(false);
  const [isFindOpen, setIsFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [saveAsFolderId, setSaveAsFolderId] = useState<string>('');
  const [saveAsName, setSaveAsName] = useState<string>('Untitled.txt');
  const [saveAsExtension, setSaveAsExtension] = useState<string>('txt');

  // Open Dialog State
  const [availableFiles, setAvailableFiles] = useState<OrionFile[]>([]);
  const [availableFolders, setAvailableFolders] = useState<OrionFolder[]>([]);
  const [selectedFolderForOpen, setSelectedFolderForOpen] = useState<string | null>(null);
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');

  // Cursor position
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial file if specified
  useEffect(() => {
    async function loadInitial() {
      if (initialFileId) {
        try {
          const file = await orionFileSystemService.getFile(initialFileId);
          if (file) {
            setCurrentFile(file);
            setContent(file.content || '');
            setFileName(`${file.name}.${file.extension}`);
            setIsDirty(false);
          }
        } catch (e) {
          console.error('Failed to load initial file in Notepad', e);
        }
      }
    }
    loadInitial();
  }, [initialFileId]);

  // Listen for global open-file events targeted to notepad
  useEffect(() => {
    const handleOpenFileEvent = async (e: Event) => {
      const customEvent = e as CustomEvent<{ fileId: string }>;
      if (customEvent.detail && customEvent.detail.fileId) {
        try {
          const file = await orionFileSystemService.getFile(customEvent.detail.fileId);
          if (file) {
            setCurrentFile(file);
            setContent(file.content || '');
            setFileName(`${file.name}.${file.extension}`);
            setIsDirty(false);
            showToast(`Opened ${file.name}.${file.extension}`, 'info', 'Notepad');
          }
        } catch (err) {
          showToast('Failed to open file in Notepad', 'error', 'Notepad');
        }
      }
    };

    window.addEventListener('orion:open-file', handleOpenFileEvent);
    window.addEventListener('orion:notepad-open', handleOpenFileEvent);
    return () => {
      window.removeEventListener('orion:open-file', handleOpenFileEvent);
      window.removeEventListener('orion:notepad-open', handleOpenFileEvent);
    };
  }, [showToast]);

  // Update cursor position and dirty flag
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
    updateCursorPos(e.target);
  };

  const updateCursorPos = (target: HTMLTextAreaElement) => {
    const textBefore = target.value.substring(0, target.selectionStart);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+O, Ctrl+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenDialog();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, content, fileName, isDirty]);

  // New File
  const handleNewFile = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Discard and create new file?')) {
        return;
      }
    }
    setCurrentFile(null);
    setContent('');
    setFileName('Untitled.txt');
    setIsDirty(false);
    showToast('New document created', 'info', 'Notepad');
  };

  // Save (updates current or prompts Save As)
  const handleSave = async () => {
    if (!currentFile) {
      handleOpenSaveAs();
      return;
    }

    try {
      const updated = await orionFileSystemService.updateFile(currentFile.id, {
        content,
      });
      setCurrentFile(updated);
      setIsDirty(false);
      showToast(`Saved ${updated.name}.${updated.extension}`, 'success', 'Notepad');
    } catch (e: any) {
      showToast(`Failed to save: ${e?.message || 'Error'}`, 'error', 'Notepad');
    }
  };

  // Open Save As Dialog
  const handleOpenSaveAs = async () => {
    try {
      const folders = await orionFileSystemService.listFolders(null);
      setAvailableFolders(folders);
      const docsFolder = folders.find(f => f.systemKey === 'documents') || folders[0];
      setSaveAsFolderId(docsFolder ? docsFolder.id : '');
      setSaveAsName(currentFile ? `${currentFile.name}.${currentFile.extension}` : fileName);
      setIsSaveAsOpen(true);
    } catch (e) {
      showToast('Could not load folder list', 'error', 'Notepad');
    }
  };

  // Execute Save As
  const handleExecuteSaveAs = async () => {
    if (!saveAsName.trim()) {
      showToast('File name cannot be empty', 'warning', 'Notepad');
      return;
    }
    if (!saveAsFolderId) {
      showToast('Please select a destination folder', 'warning', 'Notepad');
      return;
    }

    try {
      const parts = saveAsName.split('.');
      const ext = parts.length > 1 ? parts.pop()! : saveAsExtension;
      const baseName = parts.join('.');

      const newFile = await orionFileSystemService.createFile({
        name: baseName,
        extension: ext,
        content,
        folderId: saveAsFolderId,
        ownerName: user?.email || 'Active User',
      });

      setCurrentFile(newFile);
      setFileName(`${newFile.name}.${newFile.extension}`);
      setIsDirty(false);
      setIsSaveAsOpen(false);
      showToast(`Saved as ${newFile.name}.${newFile.extension}`, 'success', 'Notepad');
    } catch (e: any) {
      showToast(`Save As failed: ${e?.message || 'Error'}`, 'error', 'Notepad');
    }
  };

  // Open File Dialog
  const handleOpenDialog = async () => {
    try {
      const [folders, files] = await Promise.all([
        orionFileSystemService.listFolders(null),
        orionFileSystemService.listFiles(null),
      ]);
      setAvailableFolders(folders);
      setAvailableFiles(files);
      setIsOpenModalOpen(true);
    } catch (e) {
      showToast('Could not load files list', 'error', 'Notepad');
    }
  };

  // Select File to Open
  const handleSelectFileToOpen = (file: OrionFile) => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Discard and open selected file?')) {
        return;
      }
    }
    setCurrentFile(file);
    setContent(file.content || '');
    setFileName(`${file.name}.${file.extension}`);
    setIsDirty(false);
    setIsOpenModalOpen(false);
    showToast(`Opened ${file.name}.${file.extension}`, 'info', 'Notepad');
  };

  // Export to local disk
  const handleExportLocal = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${fileName} to Downloads`, 'success', 'Notepad');
  };

  // Find & Replace
  const handleFindNext = () => {
    if (!findQuery || !textareaRef.current) return;
    const text = content;
    const startIndex = textareaRef.current.selectionEnd;
    const matchIndex = text.toLowerCase().indexOf(findQuery.toLowerCase(), startIndex);
    
    if (matchIndex !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(matchIndex, matchIndex + findQuery.length);
    } else {
      // Loop around
      const wrapIndex = text.toLowerCase().indexOf(findQuery.toLowerCase(), 0);
      if (wrapIndex !== -1) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(wrapIndex, wrapIndex + findQuery.length);
      } else {
        showToast('Text not found', 'info', 'Notepad');
      }
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replaceQuery);
    setContent(newContent);
    setIsDirty(true);
    showToast('Replaced all occurrences', 'success', 'Notepad');
  };

  // Counts
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Filtered files for open dialog
  const filteredOpenFiles = availableFiles.filter(f => {
    if (selectedFolderForOpen && f.folderId !== selectedFolderForOpen) return false;
    if (fileSearchQuery) {
      return (
        f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
        f.extension.toLowerCase().includes(fileSearchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#0c0e11] text-os-text-primary select-none overflow-hidden rounded-b-xl">
      {/* Top Application Bar & Menu */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-[#12151a] border-b border-white/[0.08] text-xs gap-2.5">
        <div className="flex items-center gap-1.5">
          {/* Quick Actions */}
          <button
            type="button"
            onClick={handleNewFile}
            title="New File (Ctrl+N)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FilePlus size={14} className="text-sky-400" />
            <span className="font-medium">New</span>
          </button>

          <button
            type="button"
            onClick={handleOpenDialog}
            title="Open File (Ctrl+O)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FolderOpen size={14} className="text-amber-400" />
            <span className="font-medium">Open</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            title="Save File (Ctrl+S)"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium",
              isDirty 
                ? "bg-sky-600 hover:bg-sky-500 text-white" 
                : "bg-white/[0.05] hover:bg-white/[0.08] text-slate-300"
            )}
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSaveAs}
            title="Save As..."
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileText size={14} className="text-slate-400" />
            <span>Save As...</span>
          </button>

          <div className="h-4 w-px bg-white/[0.1] mx-1" />

          {/* Edit Tools */}
          <button
            type="button"
            onClick={() => setIsFindOpen(!isFindOpen)}
            title="Find & Replace (Ctrl+F)"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer",
              isFindOpen ? "bg-white/[0.12] text-white" : "hover:bg-white/[0.06] text-slate-400 hover:text-white"
            )}
          >
            <Search size={14} />
            <span>Find</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWordWrap(!isWordWrap)}
            title="Toggle Word Wrap"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer",
              isWordWrap ? "bg-white/[0.12] text-white" : "hover:bg-white/[0.06] text-slate-400 hover:text-white"
            )}
          >
            <WrapText size={14} />
            <span>Wrap</span>
          </button>

          <button
            type="button"
            onClick={() => setFontFamily(fontFamily === 'mono' ? 'sans' : 'mono')}
            title="Toggle Font (Monospace / Sans)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Type size={14} />
            <span>{fontFamily === 'mono' ? 'Mono' : 'Sans'}</span>
          </button>
        </div>

        {/* File Name & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-1 rounded-lg border border-white/[0.08]">
            <span className="font-medium text-white text-xs">
              {fileName}
            </span>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isDirty ? "bg-amber-400" : "bg-emerald-400"
            )} title={isDirty ? "Unsaved changes" : "All changes saved"} />
          </div>

          <button
            type="button"
            onClick={handleExportLocal}
            title="Export to Local PC"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs cursor-pointer transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {isFindOpen && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-os-surface-tint/90 border-b border-os-border/50 text-xs">
          <div className="flex items-center gap-1.5 bg-os-surface px-2 py-1 rounded border border-os-border/60">
            <Search size={12} className="text-os-text-muted" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={e => setFindQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFindNext()}
              className="bg-transparent border-none outline-none text-xs w-36 text-os-text-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-os-surface px-2 py-1 rounded border border-os-border/60">
            <span className="text-os-text-muted text-[10px]">Replace:</span>
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={e => setReplaceQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-36 text-os-text-primary"
            />
          </div>

          <button
            type="button"
            onClick={handleFindNext}
            className="px-2.5 py-1 rounded bg-os-accent/20 hover:bg-os-accent/30 text-os-accent font-medium text-xs"
          >
            Next
          </button>

          <button
            type="button"
            onClick={handleReplaceAll}
            className="px-2.5 py-1 rounded bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs"
          >
            Replace All
          </button>

          <button
            type="button"
            onClick={() => setIsFindOpen(false)}
            className="p-1 rounded hover:bg-os-surface-hover text-os-text-muted hover:text-os-text-primary ml-auto"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Text Editor Workspace */}
      <div className="flex-1 relative overflow-hidden bg-os-surface p-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyUp={e => updateCursorPos(e.currentTarget)}
          onClick={e => updateCursorPos(e.currentTarget)}
          placeholder="Start typing your notes, code, supply chain memos, or markdown here..."
          className={cn(
            "w-full h-full p-4 bg-transparent resize-none outline-none text-os-text-primary placeholder:text-os-text-muted/40",
            fontFamily === 'mono' ? 'font-mono' : 'font-sans',
            isWordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
          )}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-os-surface-tint border-t border-os-border/40 text-[11px] text-os-text-muted">
        <div className="flex items-center gap-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{charCount} characters</span>
          <span>{wordCount} words</span>
          <span>UTF-8</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check size={12} />
            <span>Virtual FS Connected</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-1 hover:text-os-text-primary"
            >
              A-
            </button>
            <span>{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize(Math.min(28, fontSize + 1))}
              className="px-1 hover:text-os-text-primary"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Save As Modal */}
      {isSaveAsOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-md p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-os-border/60 pb-3">
              <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
                <Save size={16} className="text-cyan-400" />
                Save Document to Orion File System
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveAsOpen(false)}
                className="text-os-text-muted hover:text-os-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-os-text-secondary font-medium mb-1 block">File Name</label>
                <input
                  type="text"
                  value={saveAsName}
                  onChange={e => setSaveAsName(e.target.value)}
                  placeholder="e.g. My Supply Chain Report.txt"
                  className="w-full bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-os-text-primary outline-none focus:border-os-accent"
                />
              </div>

              <div>
                <label className="text-os-text-secondary font-medium mb-1 block">Destination Folder</label>
                <select
                  value={saveAsFolderId}
                  onChange={e => setSaveAsFolderId(e.target.value)}
                  className="w-full bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-os-text-primary outline-none focus:border-os-accent"
                >
                  {availableFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-os-text-secondary font-medium mb-1 block">Format</label>
                <select
                  value={saveAsExtension}
                  onChange={e => setSaveAsExtension(e.target.value)}
                  className="w-full bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-os-text-primary outline-none focus:border-os-accent"
                >
                  <option value="txt">Plain Text Document (.txt)</option>
                  <option value="md">Markdown Document (.md)</option>
                  <option value="json">JSON Configuration (.json)</option>
                  <option value="csv">CSV Spreadsheet (.csv)</option>
                  <option value="scm">Orion SCM Data (.scm)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-os-border/60 pt-3">
              <button
                type="button"
                onClick={() => setIsSaveAsOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSaveAs}
                className="px-4 py-1.5 rounded-lg bg-os-accent hover:bg-os-accent/90 text-black font-semibold text-xs transition-colors"
              >
                Save File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open File Modal */}
      {isOpenModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-os-border/60 pb-3">
              <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
                <FolderOpen size={16} className="text-amber-400" />
                Open File from Orion Virtual File System
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenModalOpen(false)}
                className="text-os-text-muted hover:text-os-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Folder filter & search */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 bg-os-surface-tint border border-os-border/60 rounded-lg px-3 py-1.5 text-xs">
                <Search size={14} className="text-os-text-muted" />
                <input
                  type="text"
                  value={fileSearchQuery}
                  onChange={e => setFileSearchQuery(e.target.value)}
                  placeholder="Search file name or extension..."
                  className="bg-transparent border-none outline-none w-full text-os-text-primary"
                />
              </div>

              <select
                value={selectedFolderForOpen || ''}
                onChange={e => setSelectedFolderForOpen(e.target.value || null)}
                className="bg-os-surface-tint border border-os-border/60 rounded-lg px-3 py-1.5 text-xs text-os-text-primary outline-none"
              >
                <option value="">All Folders</option>
                {availableFolders.map(f => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Files List */}
            <div className="flex-1 overflow-y-auto max-h-72 border border-os-border/50 rounded-lg divide-y divide-os-border/30">
              {filteredOpenFiles.length === 0 ? (
                <div className="p-8 text-center text-os-text-muted text-xs">
                  No compatible files found in this location.
                </div>
              ) : (
                filteredOpenFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFileToOpen(file)}
                    className="flex items-center justify-between p-3 hover:bg-os-surface-hover cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-xs font-medium text-os-text-primary group-hover:text-os-accent">
                          {file.name}.{file.extension}
                        </div>
                        <div className="text-[10px] text-os-text-muted">
                          {Math.round(file.size / 1024 * 10) / 10} KB • Modified {new Date(file.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-os-accent/10 group-hover:bg-os-accent group-hover:text-black text-os-accent text-xs font-medium transition-colors"
                    >
                      Open
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-os-border/60 pt-3">
              <button
                type="button"
                onClick={() => setIsOpenModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
