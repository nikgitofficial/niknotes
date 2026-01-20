import Image from "next/image";
import { HiOutlineMail, HiOutlineGlobeAlt } from "react-icons/hi";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full backdrop-blur-md bg-white/30 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-[#006400] text-sm italic">
        
        {/* Logo + Text */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.location.href = "/"}
        >
          <Image
            src="/images/logov3.png"
            alt="NikNotes Logo"
            width={50}
            height={30}
          />
          <p>© {new Date().getFullYear()} NikNotes. All rights reserved.</p>
        </div>

        {/* Links + Social Icons */}
        <div className="flex gap-4 mt-2 md:mt-0 items-center">
          {["Privacy", "Terms", "Contact"].map((item) => (
            <a
              key={item}
              href={item.toLowerCase()}
              className="relative hover:text-[#006400] transition-colors duration-200
                before:content-[''] before:absolute before:-bottom-1 before:left-0 before:w-0 before:h-[1px] 
                before:bg-[#006400] before:transition-all before:duration-300 hover:before:w-full"
            >
              {item}
            </a>
          ))}

          {/* Social Icons */}
          <a
            href="https://github.com/nikgitofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#006400] hover:text-gray-700 transition-colors"
            title="GitHub"
          >
            <FaGithub size={20} />
          </a>

          <a
            href="mailto:nickforjobacc@gmail.com"
            className="text-[#006400] hover:text-gray-700 transition-colors"
            title="Email"
          >
            <HiOutlineMail size={20} />
          </a>

          {/* Portfolio / Website Icon */}
          <a
            href="https://nikkport.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#006400] hover:text-gray-700 transition-colors"
            title="Portfolio"
          >
            <HiOutlineGlobeAlt size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
