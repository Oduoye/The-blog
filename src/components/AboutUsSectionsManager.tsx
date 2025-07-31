import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAboutUsSections } from "@/hooks/useAboutUsSections"; // useAboutUsSections is updated
import { Plus, Edit, Trash2, Save, X, GripVertical, RefreshCw, FileText, Image, AlertCircle, Monitor, Target, Users, Shield, BookOpen, Lightbulb, Award, Heart, Globe, Zap, Code, Briefcase, Mail, Phone, MapPin, Star, CheckCircle, TrendingUp, Layers, Settings, Database, Lock, Wifi, Smartphone, Laptop, Server, Cloud, Search, Eye, MessageSquare, ThumbsUp, Share2, Download, Upload, Play, Pause, Volume2, Camera, Video, Mic, Headphones, Calendar, Clock, Bell, Flag, Home, Building, Car, Plane, Train, Bike, Coffee, Pizza, Gift, Music, Gamepad2, Palette, Brush, Scissors, Wrench, Hammer, HardDrive as Screwdriver, Key, Compass, Map, Navigation, Anchor, Rocket, Satellite, Sun, Moon, CloudRain, Snowflake, Thermometer, Umbrella, Flower, Trees as Tree, Leaf, Mountain, Waves, Siren as Fire, Droplets, Wind, Rainbow, Sparkles, Gem, Crown, Trophy, Medal, Ribbon, Ticket, Tag, Package, ShoppingCart, CreditCard, DollarSign, PiggyBank, TrendingDown, BarChart, PieChart, Activity, HeartPulse as Pulse, Zap as Lightning, Battery, Plug, Radio, Tv, Speaker, Headset, Printer, Scan as Scanner, Fan as Fax, HardDrive, Usb, Bluetooth, Rss, AtSign, Hash, Percent, Plus as PlusIcon, Minus, Equal, Divide, X as XIcon, Check, CheckSquare, Square, Circle, Triangle, Hexagon, Octagon, Diamond, Heart as HeartIcon, Star as StarIcon, Bookmark, Paperclip, Link, Unlink, Copy, Nut as Cut, Cast as Paste, Undo, Redo, RotateCcw, RotateCw, Repeat, Shuffle, SkipBack, SkipForward, FastForward, Rewind, StepBack, StepForward, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronsUp, ChevronsDown, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, ExternalLink, Maximize, Minimize, Move, MoreHorizontal, MoreVertical, Menu, Grid, List, Columns, Rows, Layout, Sidebar, PanelLeft, PanelRight, PanelTop, PanelBottom, Fullscreen, Minimize2, Maximize2, ZoomIn, ZoomOut, Focus, Crosshair, MousePointer, Hand, Grab, GripHorizontal, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Type, Heading, Quote, Code2, Terminal, Command, Option, Gift as Shift, TowerControl as Control, Bolt as Alt, Space, Pointer as Enter, Backpack as Backspace, Delete, Table as Tab, Lock as CapsLock, Lock as NumLock, Scroll as ScrollLock, Dessert as Insert, ImageUp as PageUp, ImageDown as PageDown, ListEnd as End, Grape as Escape, AArrowDown as F1, AArrowDown as F2, AArrowDown as F3, AArrowDown as F4, AArrowDown as F5, AArrowDown as F6, AArrowDown as F7, AArrowDown as F8, AArrowDown as F9, Clock10 as F10, Clock11 as F11, Clock12 as F12 } from "lucide-react";

const sectionTypes = [
  { value: 'hero', label: 'Hero Section' },
  { value: 'mission', label: 'Mission Statement' },
  { value: 'description', label: 'Description' },
  { value: 'values', label: 'Our Values' },
  { value: 'team', label: 'Team' },
  { value: 'contact', label: 'Contact Info' },
  { value: 'general', label: 'General Content' }
];

// Comprehensive icon library with categories (kept as is)
const iconLibrary = {
  business: [
    { name: 'Target', icon: Target, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' },
    { name: 'Briefcase', icon: Briefcase, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
    { name: 'Building', icon: Building, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>' },
    { name: 'TrendingUp', icon: TrendingUp, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>' },
    { name: 'Award', icon: Award, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>' },
    { name: 'Crown', icon: Crown, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>' }
  ],
  technology: [
    { name: 'Monitor', icon: Monitor, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>' },
    { name: 'Code', icon: Code, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>' },
    { name: 'Database', icon: Database, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>' },
    { name: 'Server', icon: Server, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>' },
    { name: 'Cloud', icon: Cloud, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>' },
    { name: 'Smartphone', icon: Smartphone, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>' }
  ],
  education: [
    { name: 'BookOpen', icon: BookOpen, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
    { name: 'Lightbulb', icon: Lightbulb, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>' },
    { name: 'Users', icon: Users, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { name: 'Star', icon: Star, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>' },
    { name: 'Trophy', icon: Trophy, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.75 14 20 14 20s1.96-1.25 3.03-1.79c.5-.23.97-.66.97-1.21v-2.34c0-1.06-.93-2.11-2.03-2.11h-7.94C6.93 12.55 6 13.6 6 14.66Z"/><path d="M12 2L8 7h8l-4-5Z"/></svg>' }
  ],
  security: [
    { name: 'Shield', icon: Shield, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { name: 'Lock', icon: Lock, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { name: 'Key', icon: Key, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>' },
    { name: 'Eye', icon: Eye, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' },
    { name: 'CheckCircle', icon: CheckCircle, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>' }
  ],
  communication: [
    { name: 'Mail', icon: Mail, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M22 7l-10 5L2 7"/></svg>' },
    { name: 'Phone', icon: Phone, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' },
    { name: 'MessageSquare', icon: MessageSquare, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    { name: 'Globe', icon: Globe, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' },
    { name: 'Share2', icon: Share2, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>' }
  ],
  location: [
    { name: 'MapPin', icon: MapPin, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' },
    { name: 'Home', icon: Home, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>' },
    { name: 'Navigation', icon: Navigation, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,11 22,2 13,21 11,13 3,11"/></svg>' },
    { name: 'Compass', icon: Compass, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></svg>' },
    { name: 'Map', icon: Map, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" x2="8" y1="2" y2="18"/><line x1="16" x2="16" y1="6" y2="22"/></svg>' }
  ],
  general: [
    { name: 'Heart', icon: Heart, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>' },
    { name: 'Zap', icon: Zap, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>' },
    { name: 'Sparkles', icon: Sparkles, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>' },
    { name: 'Rocket', icon: Rocket, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>' },
    { name: 'Gift', icon: Gift, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,12 20,22 4,22 4,12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>' },
    { name: 'Settings', icon: Settings, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' }
  ]
};

const AboutUsSectionsManager = () => {
  const { sections, loading, createSection, updateSection, deleteSection, reorderSections, refetch } = useAboutUsSections();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('business');
  const [showIconLibrary, setShowIconLibrary] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    section_type: "general",
    display_order: 0,
    is_active: true,
    metadata: {
      icon_svg: ""
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      section_type: "general",
      display_order: 0,
      is_active: true,
      metadata: {
        icon_svg: ""
      }
    });
    setSvgError(null);
    setIsCreating(false);
    setEditingSection(null);
    setShowIconLibrary(false);
  };

  const handleEdit = (section: any) => {
    setFormData({
      title: section.title,
      content: section.content,
      section_type: section.section_type,
      display_order: section.display_order,
      is_active: section.is_active,
      metadata: {
        icon_svg: (section.metadata as any)?.icon_svg || "",
        ...section.metadata
      }
    });
    setSvgError(null);
    setEditingSection(section.id);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    try {
      if (editingSection) {
        // Updated: pass modified_at timestamp
        await updateSection(editingSection, { ...formData, modified_at: new Date().toISOString() });
      } else {
        // Set display order to be last if creating new
        const maxOrder = Math.max(...sections.map(s => s.display_order), 0);
        await createSection({
          ...formData,
          display_order: maxOrder + 1
        });
      }
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      await deleteSection(id);
    }
  };

  const handleSvgChange = (svgCode: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        icon_svg: svgCode
      }
    }));

    // Basic SVG validation
    if (svgCode.trim() && !svgCode.trim().toLowerCase().startsWith('<svg')) {
      setSvgError('SVG code must start with <svg tag');
    } else {
      setSvgError(null);
    }
  };

  const handleIconSelect = (iconSvg: string) => {
    handleSvgChange(iconSvg);
    setShowIconLibrary(false);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      
      // Update display_order
      newSections.forEach((section, idx) => {
        section.display_order = idx + 1;
      });
      
      reorderSections(newSections);
    }
  };

  const getSectionTypeLabel = (type: string) => {
    return sectionTypes.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading about us sections...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              About Us Sections Management
            </span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <Button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Section</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Create/Edit Form */}
          {isCreating && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{editingSection ? 'Edit Section' : 'Create New Section'}</span>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Section Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter section title"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="section_type">Section Type</Label>
                      <Select
                        value={formData.section_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, section_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter section content"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Enhanced SVG Icon Section */}
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Custom SVG Icon (Optional)
                    </Label>
                    
                    {/* Icon Library Toggle */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowIconLibrary(!showIconLibrary)}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {showIconLibrary ? 'Hide' : 'Show'} Icon Library
                      </Button>
                      {formData.metadata.icon_svg && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSvgChange("")}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                          Clear Icon
                        </Button>
                      )}
                    </div>

                    {/* Icon Library */}
                    {showIconLibrary && (
                      <Card className="border-2 border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Choose from Icon Library</h4>
                            <Select
                              value={selectedIconCategory}
                              onValueChange={setSelectedIconCategory}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="location">Location</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                            {iconLibrary[selectedIconCategory as keyof typeof iconLibrary]?.map((iconItem) => {
                              const IconComponent = iconItem.icon;
                              return (
                                <button
                                  key={iconItem.name}
                                  type="button"
                                  onClick={() => handleIconSelect(iconItem.svg)}
                                  className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group flex flex-col items-center gap-1"
                                  title={iconItem.name}
                                >
                                  <IconComponent className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                                  <span className="text-xs text-gray-500 group-hover:text-blue-600 truncate w-full text-center">
                                    {iconItem.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Custom SVG Input */}
                    <div className="space-y-2">
                      <Label htmlFor="icon_svg">Or paste custom SVG code:</Label>
                      <Textarea
                        id="icon_svg"
                        value={formData.metadata.icon_svg}
                        onChange={(e) => handleSvgChange(e.target.value)}
                        placeholder="Paste your SVG code here (e.g., <svg width='24' height='24'...>...</svg>)"
                        rows={3}
                        className="font-mono text-sm"
                      />
                      
                      {/* SVG Error Message */}
                      {svgError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{svgError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {/* SVG Preview */}
                      {formData.metadata.icon_svg && !svgError && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <Label className="text-sm text-gray-600 mb-3 block">Preview:</Label>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 flex items-center justify-center text-blue-600"
                              dangerouslySetInnerHTML={{ __html: formData.metadata.icon_svg }}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{formData.title || 'Section Title'}</div>
                              <div className="text-xs text-gray-600">Icon will appear next to the section title</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Choose from our icon library above or add a custom SVG icon to display next to your section title. 
                        Make sure to include proper width/height attributes for best results.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active (visible on public page)</Label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {editingSection ? 'Update Section' : 'Create Section'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sections List */}
          <div className="space-y-4">
            {sections.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                <p className="text-gray-600 mb-4">Create your first about us section to get started.</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Section
                </Button>
              </div>
            ) : (
              sections.map((section, index) => (
                <Card key={section.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {/* Display SVG icon if available */}
                            {(section.metadata as any)?.icon_svg && (
                              <div 
                                className="w-5 h-5 flex items-center justify-center text-blue-600"
                                dangerouslySetInnerHTML={{ __html: (section.metadata as any).icon_svg }}
                              />
                            )}
                            <h3 className="font-semibold text-gray-900">{section.title}</h3>
                          </div>
                          <Badge variant={section.is_active ? "default" : "secondary"}>
                            {section.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getSectionTypeLabel(section.section_type)}
                          </Badge>
                          <span className="text-xs text-gray-500">Order: {section.display_order}</span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{section.content}</p>
                        
                        {/* Show icon indicator */}
                        {(section.metadata as any)?.icon_svg && (
                          <div className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            <span>Custom icon included</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          {/* New: Use modified_at for display if available */}
                          Created: {new Date(section.created_at!).toLocaleDateString()}
                          {section.modified_at && section.modified_at !== section.created_at && (
                            <span className="ml-2">
                              • Updated: {new Date(section.modified_at!).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {/* Reorder buttons */}
                        <div className="hidden sm:flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === sections.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            ↓
                          </Button>
                        </div>
                        
                        {/* Mobile reorder buttons */}
                        <div className="flex sm:hidden gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === sections.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            ↓
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(section)}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(section.id)}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-blue-800">
                {sections.length} total sections • {sections.filter(s => s.is_active).length} active • 
                {sections.filter(s => !s.is_active).length} inactive
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutUsSectionsManager;
