"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { UserCircle, Home, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="w-full py-4 bg-[#080808] border-b border-[#262626]">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold text-white">
            <span className="text-[#ff004f]">Voice</span>SQL
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="block md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {menuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>

        {/* Desktop navigation */}
        <ul className={`hidden md:flex items-center gap-6`}>
          <li>
            <Link
              href="/"
              className="text-white relative hover:after:w-full after:content-[''] after:w-0 after:h-[3px] after:bg-[#ff004f] after:absolute after:left-0 after:bottom-[-6px] after:transition-all after:duration-500"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="text-white relative hover:after:w-full after:content-[''] after:w-0 after:h-[3px] after:bg-[#ff004f] after:absolute after:left-0 after:bottom-[-6px] after:transition-all after:duration-500"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-transparent"
                >
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#262626] border-[#333] text-white"
              >
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                  className="hover:bg-[#ff004f] transition-colors duration-300"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>

        {/* Mobile navigation */}
        {menuOpen && (
          <ul className="md:hidden fixed top-0 right-0 w-[200px] h-screen bg-[#ff004f] z-50 pt-[50px] transition-all duration-500">
            <X
              className="absolute top-[25px] left-[25px] cursor-pointer h-6 w-6"
              onClick={toggleMenu}
            />
            <li className="block mx-[25px] my-[25px]">
              <Link href="/" className="text-white" onClick={toggleMenu}>
                Home
              </Link>
            </li>
            <li className="block mx-[25px] my-[25px]">
              <Link
                href="/dashboard"
                className="text-white"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
            </li>
            <li className="block mx-[25px] my-[25px]">
              <button
                className="text-white"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                  toggleMenu();
                }}
              >
                Sign out
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
