// Setup Window vars
//import MultiSelect from  "multi-select.js";
const allDepartmentsObject = {value: 'All', id: 'all', selected: true},
      allLocationsObject = {value: 'All', id: 'all', selected: true, count: 0};
window.departments = [ allDepartmentsObject ]
window.office_locations = [ allLocationsObject ];
window.allRoles = [];
window.allRolesByDepartment = [];
window.filters = {};

(function ($) {
  $.getUrlVar = function (key) {
    var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
    return result && unescape(result[1]) || "";
  };
})(jQuery);

jQuery(document).ready(function ($) {

  function build_teams_filter_grid(departments) {
    const teamGrid = $('[data-jobs-filter-grid="team"]');
    const teamHTML = departments.map(department => {
      if (department.jobs.length == 0) return;
      const teamId = department.name.toLowerCase().replace(/\s/g, '-');
      return `<li data-jobs-filter-list="${teamId}" class="block__jobs-filters__item" onclick="setDepartment('${department.name}');">
          <h3 class="block__jobs-filters__item-name">${department.name}</h3>
          <span class="block__jobs-filters__item-count">${department.jobs.length}</span>
        </li>`;
    })

    teamGrid.html(teamHTML);
  }

  function build_locations_filter_grid(locations) {
    const locationGrid = $('[data-jobs-filter-grid="location"]');
    const locationHTML = locations.map(location => {
      const locationId = location.value.toLowerCase().replace(/\s/g, '-');
      if (location.id === 'all') return '';
      return `<li data-jobs-filter-list="${locationId}" class="block__jobs-filters__item" onclick="setLocation('${location.id}');">
          <h3 class="block__jobs-filters__item-name">${location.value}</h3>
          <span class="block__jobs-filters__item-count">${location.count}</span>
        </li>`;
    });

    locationGrid.html(locationHTML);
  }

  function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.block__jobs-filters__heading');
    [].forEach.call(filterButtons, function(button) {
      button.addEventListener('click', pickFilterGrid);
    });
  }

  function pickFilterGrid(e) {
    e && e.preventDefault();

    const selectedGrid = e.target.getAttribute('data-filter-type');
    const targetGrid = document.querySelector(`.block__jobs-filters__grid[data-jobs-filter-grid=${selectedGrid}]`);
    const currentGrid = document.querySelector('.block__jobs-filters__grid.active');

    document.querySelector('.block__jobs-filters__heading .active').classList.remove('active');
    currentGrid.classList.remove('active');
    e.target.classList.add('active');
    targetGrid.classList.add('active');
  }

  function get_job_html(job, department) { console.log(job)
    return `
      <li class="roles-department__role" id="${job.id}">
        <h3 class="roles-department__role-title">
          <a href="${job.absolute_url}" target="" data-title="${job.title}">${job.title}</a>
        </h3>
		    <h2 class="roles-department__title">${department.name}</h2>
        <div class="roles-department__role-location" data-location="${job.location.name}">${job.location.name}</div>
        <a class="roles-department__role-apply-btn" href="${job.absolute_url}" target="">&rarr;</a>
      </li><a href="${job.absolute_url}" data-title="${job.title}" class="row-link"></a>
    `;
  }

  function get_department_html(department) {
    // if (!department.jobs.length) console.log(`department ${department.name} has no openings`);
    return `
      <li class="roles-department ${department.jobs.length === 0 ? 'no-listings' : ''}" id="${department.id}">
        
        <ul class="roles-department__role-wrapper">
          ${ 
            department.jobs.map(job => { 
              const jobHTML = get_job_html(job, department);
              return jobHTML; 
            }).join('')
          }
        </ul>
      </li>
    `;
  }

  function get_jobs_by_department(jobsByDepartment) {
    return jobsByDepartment.map(department => { 
      const departmentHTML =  get_department_html(department);
      return departmentHTML;
    }).join('');
  }

  //BUILD A DROPDOWN OF DEPARTMENTS
  function get_department_options(departments) {
    if (!departments.length) {
      console.log(`Department "${dep.name}" has no listings and won't be shown in the filters`);
      return;
    }
    
    return departments.map(dep => {
      console.log(dep.name, dep.jobs.length)
      if (dep.jobs.length) {
        return `<option value="${dep.id}">${dep.name}</option>`
      }
    })
  }

  //BUILD A DROPDOWN OF LOCATIONS FROM DEPARTMENTS - not used, can re-enable if you want to sort via departments
  function get_location_options(departments) {
    if (!departments.length) throw new Error('no department data from Glassdoor API');

    departments.forEach(dep => {
      if (dep.jobs.length) {
        dep.jobs.forEach(job => {
          if (!window.office_locations.find(location => location.value === job.location.name)) {
            window.office_locations.push({
              value: job.location.name,
              id: job.location.name.toLowerCase().replaceAll(' ', '-').replaceAll(',', '-'),
              count: 0
            });
          }
          window.office_locations.find(location => location.value === job.location.name).count++;
          window.office_locations.find(location => location.id === 'all').count++;
        });
      }
    })
    window.office_locations = window.office_locations.sort((a, b) => { return a.value.localeCompare(b.value) });
    return build_locations_options();
  }

  function build_locations_options(office_locations) {
    if (!window.office_locations.length) throw new Error('missing locations data!');

    return window.office_locations.map(location => {
      return`<option value="${location.id}">${location.value}</option>`;
    });
  }

  function build_jobs_list_HTML(jobsByDepartment) {
    return `
      <div class="roles-select-wrapper"> 
      <h4 class="section-title">Filter Jobs</h4>
        <div class="roles-select__search">
        
          <form id="search-filter">
            
            <input type="search" name="search_term" id="search-filter-input" placeholder="Search Jobs">
			      <input type="submit" value="submit" id="search-filter-btn">
          </form>
		  
        </div>
        <div class="roles-select__left">
          <label>Location</label>
          <div class="roles-select__location roles-select" id="location-filter"></div>
          <label>Department</label>
          <div class="roles-select__department roles-select" id="department-filter"></div>
         
        </div>
        
		    <button id="search-jobs-btn">Search Jobs</button>
      </div>

      <div class="roles__wrapper">
	  	<div class="pagination-text"></div>
        <ul class="roles" id="roles">
            <li class="roles-department__heading">
                <label>department</label>
                <label>role</label>
                <label>location</label>
            </li>
            ${get_jobs_by_department(jobsByDepartment)}
        </ul>
		<div class="pagination-controls"></div>
      </div>
    `;

  }

  function get_all_jobs_by_department() {
	  var totalJobs = []
    $.ajax({
      url: `${boardApiUrl}/embed/departments`,
      jsonp: 'callback',
      dataType: 'jsonp',
      success: function (res) {
        // console.log('departments:', deps)

        window.allRolesByDepartment = res.departments;
        res.departments
          .filter(department => department.jobs.length)
          .forEach(department => {
          window.departments.push({
            value: department.name,
            id: department.id
          })
          department.jobs.forEach(job => {
            // filter out duplicates
            if (!window.office_locations.find(location => location.value === job.location.name)) {
              // add to locations list
              window.office_locations.push({
                value: job.location.name,
                id: job.location.name.toLowerCase().replaceAll(' ', '-').replaceAll(',', '-'),
                count: 0
              });
			  
            }
			totalJobs.push(job);
            window.office_locations.find(location => location.value === job.location.name).count++;
            window.office_locations.find(location => location.id === 'all').count++;
          });
        });
        const jobsListHTML = build_jobs_list_HTML(res.departments);
        
        $('.greenhouse-wrapper').empty().append(jobsListHTML);
        $('.greenhouse-wrapper').find('#roles').fadeOut(0).fadeIn()

        build_select_filters();
        build_teams_filter_grid(res.departments);
        build_locations_filter_grid(window.office_locations);
        initFilterButtons();
		let jobs = document.querySelectorAll('.roles-department:not(.no-listings):not(.no-results):not(.hide)')
		buildPagination(jobs);
      }
    });
  }

  function get_all_jobs_list() {
    $.ajax({
      url: `${boardApiUrl}/jobs`,
      jsonp: 'callback',
      dataType: 'jsonp',
      success: function (res) {
        window.allRoles = res.jobs;
      }
    });
  }

  //FILTER BY DEPARTMENT
  async function filterByDepartment(departments) {
    hideAllDepartments();
    await Array.from(departments).map(dep => {
      if (document.getElementById(dep.id) ) document.getElementById(dep.id).classList.remove('hide');
    });
	let jobs = document.querySelectorAll('.roles-department:not(.no-listings):not(.no-results):not(.hide)')
	buildPagination(jobs);
	
  }
  function showAllDepartments() {
    const departments = document.querySelectorAll('.roles-department');
    departments.forEach(department => {
      department.classList.remove('hide');
    })

  }
  function hideAllDepartments() {
    const departments = document.querySelectorAll('.roles-department');
    departments.forEach(department => {
      department.classList.add('hide');
    })
  }
  


  document.addEventListener('click', function(e){	
	if(e.target.className == 'job-page'){
		handlePagination(e.target.dataset.num)
	}
  })

  var pageLimit = 20;
  var currentPage = 1;

  function buildPagination(jobs){
	
	  let totalJobs = jobs.length;
	  let startIndex = (pageLimit * (currentPage - 1)) + 1;
	  let endIndex = totalJobs < pageLimit ? totalJobs : ((currentPage * pageLimit) > totalJobs ? totalJobs : (currentPage * pageLimit));
    if(totalJobs <= 0){
      document.querySelector('.pagination-text').innerHTML = `No Matching Jobs`;
      return false;
    }
    else {
      document.querySelector('.pagination-text').innerHTML = `Showing <strong>${startIndex}</strong> to <strong>${endIndex}</strong> of <strong>${totalJobs}</strong> matching jobs`;
    }
      

    Array.from(document.querySelectorAll('.roles-department.paging')).map(el => el.classList.remove('paging'));
    
    let paged_jobs = Array.from(jobs).splice(startIndex-1, pageLimit);
    
    Array.from(jobs).map(el => {
      el.classList.add('paging');
    })
    paged_jobs.map(el => {
      el.classList.remove('paging');
    })

    let numPages = Math.ceil(totalJobs / pageLimit);
    let pages = ``;
    if(currentPage > 1)
      pages += `<button data-num="${currentPage-1}" value="${currentPage-1}" class="job-page"><i class="material-icons">arrow_left</i></button>`;
    for(let i = 1; i <= numPages; i++){
      pages += `<button data-num="${i}" value="${i}" class="job-page${currentPage==i ? ' current' : ''}">${i}</button>`;
    }
    if(currentPage < numPages)
      pages += `<button data-num="${parseInt(currentPage)+1}" value="${parseInt(currentPage)+1}" class="job-page"><i class="material-icons">arrow_right</i></button>`;
    document.querySelector('.pagination-controls').innerHTML = `<div class="pagination">${pages}</div>`;
  }

  function handlePagination(page) {
	  let jobs = document.querySelectorAll('.roles-department:not(.no-listings):not(.no-results):not(.hide):not(.no-search-results)');
	  currentPage = page;
	  console.log(jobs)
	  buildPagination(jobs);
  }

  //FILTER BY LOCATION
  async function filterByLocations(locations) {
    const filtered_jobs_list = window.allRoles.filter(role => {
      const role_location_id = role.location.name.toLowerCase().replaceAll(' ', '-').replaceAll(',', '-');
      return locations.find(location => {
        return location.id === role_location_id
      })
    });
    hideAllRolesByLocation();
    await Promise.all(filtered_jobs_list.map(job => {
      document.getElementById(job.id).classList.remove('location-filtered');
    }));
	
	  let jobs = document.querySelectorAll('.roles-department:not(.no-listings):not(.no-results):not(.hide)')
	  buildPagination(jobs);
  }

  function showAllRolesByLocation() {
    const roles = document.querySelectorAll('.location-filtered');
    roles.forEach(role => {
      role.classList.remove('location-filtered');
    });
	  //buildPagination(roles);
  }
  function hideAllRolesByLocation() {
    const roles = document.querySelectorAll('.roles-department__role');
    roles.forEach(role => {
      role.classList.add('location-filtered');
    });
  }

  // Set "no results" messaging
  function set_no_results_messages(){
    const departments = document.querySelectorAll('.roles-department');
    departments.forEach(department => {
      const visibleJobs = department.querySelectorAll('.roles-department__role:not(.location-filtered):not(.search-filtered)');
      if (visibleJobs.length) {
        department.classList.remove('no-results');
      } else {
        department.classList.add('no-results');
      }
    });
  }

  function reset_no_results_messaging() {
    const departments = document.querySelectorAll('.roles-department');
    departments.forEach(department => {
      department.classList.remove('no-results');
    });
  }


  // FILTER BY SEARCH

  function showAllRolesBySearch() {
    const roles = document.querySelectorAll('.search-filtered');
    const departments = document.querySelectorAll('.roles-department');
    for (i=0; i<roles.length; i++) {
      roles[i].classList.remove('search-filtered');
    }
    departments.forEach(department => {
      department.classList.remove('no-search-results');
    });
    resetSearchHighlight();
  }

  function hideAllRolesBySearch() {
    const roles = document.querySelectorAll('.roles-department__role');
    const departments = document.querySelectorAll('.roles-department');
    roles.forEach(role => {
      role.classList.add('search-filtered');
    });
    departments.forEach(department => {
      department.classList.add('no-search-results');
    });
  }

  function resetSearchHighlight() {
    const highlights = document.querySelectorAll('.search-highlight');
    for (i=0; i<highlights.length; i++) {
      unwrap(highlights[i]);
    }
  }

  async function filterBySearch(searchTerm) {
    //console.log('search', searchTerm);
    
    const filtered_jobs_list = window.allRoles.filter(role => {
      const titleMatch = role.title.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1,
            locationMatch = role.location.name.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1
      return titleMatch || locationMatch;
    });
    hideAllRolesBySearch();

    const regex = new RegExp(searchTerm, 'gi');
	  let matches = [];
    await Promise.all(filtered_jobs_list.map(job => {
      const matchedJob = document.getElementById(job.id),
            title = matchedJob.querySelector('.roles-department__role-title a'),
            location = matchedJob.querySelector('.roles-department__role-location');
	  
      matchedJob.classList.remove('search-filtered');
	    let parentMatch = getAncestorByClass(matchedJob, 'roles-department');
      parentMatch.classList.remove('no-search-results');
	    matches.push(parentMatch);
      title.innerHTML = title.getAttribute('data-title').replace(regex,'<span class="search-highlight">$&</span>');
      location.innerHTML = location.getAttribute('data-location').replace(regex,'<span class="search-highlight">$&</span>');

      console.log(job.title, matchedJob.innerHTML.match(searchTerm)); //.forEach(match => { console.log(match) });
    }));
	  buildPagination(matches);
	  handlePagination(1);
  }


  // BUILD MULTISELECTS
  function build_select_filters() {

    window.setDepartment = function(departmentName) {
      resetLocations();
      const selectedDepartments = [window.departments.find(department => department.value === departmentName)];
      window.filters.departments = selectedDepartments;
      departmentSelect.setCurrent(selectedDepartments);
      filterByDepartment(window.filters.departments);
      set_no_results_messages();
      document.getElementById('openings').classList.add('department-filter-applied')

      window.scroll({
        behavior: 'smooth',
        left: 0,
        top: document.getElementById('openings').offsetTop - 200
      });
    }

    // Department Filter
    window.departmentSelect = new MultiSelect('#department-filter', {
      items: window.departments,
      current: [allDepartmentsObject],
      maxHeight: 200,
      sort: false
    });

    function resetDepartments() {
      departmentSelect.setCurrent([allDepartmentsObject]);
      window.filters.departments = [allDepartmentsObject];
      showAllDepartments();
      document.getElementById('openings').classList.remove('department-filter-applied');
	    const visibleJobs = document.querySelectorAll('.roles-department:not(.no-listings):not(.no-results):not(.hide)');
	    buildPagination(visibleJobs);
    }

    departmentSelect.on('change', e => {
      const currentValue = departmentSelect.getCurrent(),
            justClicked = e.detail;

      // Reset 
      reset_no_results_messaging();

      // If "All" toggled on
      if (justClicked.id === 'all' && currentValue.some(department => {return department.id === 'all'}) ) {
        resetDepartments();
      } else {
      // Otherwise de-select 'all" and set other filters
        
        // Store filters value without 'all' 
        const selectedDepartments = departmentSelect.getCurrent().filter(item => {
          return item.id !== 'all';
        });

        if (selectedDepartments.length === 0) {
          resetDepartments();
        } else {
          window.filters.departments = selectedDepartments;
          departmentSelect.setCurrent(selectedDepartments);
          filterByDepartment(window.filters.departments);
          set_no_results_messages();
          document.getElementById('openings').classList.add('department-filter-applied');
        }
      }
    });

    // Location Filter

    window.setLocation = function(locationId) {
      resetDepartments();
      const selectedLocations = [window.office_locations.find(location => location.id === locationId)];
      window.filters.locations = selectedLocations;
      window.locationSelect.setCurrent(selectedLocations);
      filterByLocations(window.filters.locations);
      set_no_results_messages();
      document.getElementById('openings').classList.add('location-filter-applied');

      window.scroll({
        behavior: 'smooth',
        left: 0,
        top: document.getElementById('openings').offsetTop - 200
      });
    }

    window.locationSelect = new MultiSelect('#location-filter', {
      items: window.office_locations,
      current: [allLocationsObject],
      maxHeight: 200,
      sort: false
    });

    function resetLocations() {
      locationSelect.setCurrent([allLocationsObject]);
      window.filters.locations = [allLocationsObject];
      showAllRolesByLocation();
      document.getElementById('openings').classList.remove('location-filter-applied');
	    const visibleJobs = document.querySelectorAll('.roles-department:not(.no-listings):not(.no-results):not(.hide)');
	    buildPagination(visibleJobs)
    }

    locationSelect.on('change', e => {
      const currentValue = locationSelect.getCurrent(),
            justClicked = e.detail;

      // Reset 
      reset_no_results_messaging();

      // If "All" toggled on
      if (justClicked.id === 'all' && currentValue.some(department => {return department.id === 'all'}) ) {
        resetLocations()
      } 
      else {
        // Otherwise de-select 'all" and set other filters
        // Store filters value without 'all' 
        const selectedLocations = locationSelect.getCurrent().filter(item => {
          return item.id !== 'all';
        });

        if (selectedLocations.length === 0) {
          resetLocations()
        } 
        else {
          window.filters.locations = selectedLocations;
          locationSelect.setCurrent(selectedLocations);
          filterByLocations(window.filters.locations);
          set_no_results_messages();
          document.getElementById('openings').classList.add('location-filter-applied');
        }
      }
    });


    //Search Filter
    const searchFilter = document.getElementById('search-filter-input');
    function handleSearchInput(e) { 
      if (e.target.value === '') {
        document.getElementById('openings').classList.remove('search-filter-applied');
        showAllRolesBySearch();
      } else {
        document.getElementById('openings').classList.add('search-filter-applied');
        filterBySearch(e.target.value);
      }
    }

    searchFilter.addEventListener('input', throttle(handleSearchInput, 60));
	
    document.getElementById('search-filter').addEventListener('submit', e => { 
      e.preventDefault();
      var event = new Event('input', {
          bubbles: true,
          cancelable: true,
      });
      searchFilter.dispatchEvent(event);
    });

    document.getElementById('search-jobs-btn').addEventListener('click', e => { 
      let searchterm = document.getElementById('search-filter-input').value;
      filterBySearch(searchterm);
    });

  }

  function getAncestorByClass(elem, selector) {
	if (elem.parentElement === null) {
	  return false;
	} else if (elem.classList.contains(selector)) {
	  return elem;
	} else {
	  return getAncestorByClass(elem.parentElement, selector);
	}
  }
  
  function throttle(callback, interval) {
	var enableCall = true;
	return function () {
	  if (!enableCall) return;
	  enableCall = false;
	  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
		args[_key] = arguments[_key];
	  }
	  callback.apply(this, args);
	  setTimeout(function () {
		return enableCall = true;
	  }, interval);
	};
  }

  function unwrap(wrapper) {
	// place childNodes in document fragment
	var docFrag = document.createDocumentFragment();
	while (wrapper.firstChild) {
	  var child = wrapper.removeChild(wrapper.firstChild);
	  docFrag.appendChild(child);
	}
  
	// replace wrapper with document fragment
	wrapper.parentNode.replaceChild(docFrag, wrapper);
  }
  
  // Load Content
  get_all_jobs_by_department();
  get_all_jobs_list(); // for use with filters
});