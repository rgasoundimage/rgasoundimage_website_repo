import { useEffect } from "react";

import ProjectCard from "../components/cards/ProjectCard";

const Projects = () => {

    useEffect(() => {
      document.title =
        " Professional Audio Installation Projects | RGA Sound Image";
    }, []);
  
    return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">Projects</h1>
        <p className="text-slate-700">
          Selected turnkey deployments delivered by our team. Each project includes consultation,
          integration, and on-site calibration.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[       
          {
            title: "Multiplex – Hyderabad",
            tag: "Cinema",
            desc: "Chainwide standards rollout and commissioning support.",
          },
          {
            title: "Home Theatre – Hyderabad",
            tag: "Home Cinema",
            desc: "5.1 Home theatre system with screen, speaker and subwoofer alignment.",
            video: "/videos/Hometheatre-Hyderabad.mp4",
          }, 
          {
            title: "Auditorium – Telangana",
            tag: "Pro AV",
            desc: "Sub-satellite arrays for speech & music, matrix routing.",
          },
        ].map((p, i) => (
          <ProjectCard key={i} {...p} />
        ))}
      </div>
    </section>
  );
  };

export default Projects;
